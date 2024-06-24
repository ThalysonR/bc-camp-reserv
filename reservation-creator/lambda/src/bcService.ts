import {
  combineLatestWith,
  concatMap,
  delay,
  filter,
  from,
  map,
  Observable,
  shareReplay,
  tap
} from 'rxjs';
import { ComposeAvailabilityInput, ComposeAvailabilityOutput } from './types';
import { BcCampingClient } from './client';
import { dateTimeToDate, mergeDateRanges } from './helper';
import { MapResource } from './client/model/map';
import { ResourceLocation } from './client/model/resourceLocation';
import { logger } from './log';

export function getComposedAvailability({
  locationIds,
  equipmentId,
  subEquipmentId,
  dateRanges,
  nights,
  preferWeekend
}: ComposeAvailabilityInput): Observable<ComposeAvailabilityOutput> {
  const client = new BcCampingClient(fetch);
  const mergedDateRanges = mergeDateRanges(dateRanges);
  const mapsResourceLocations$ = client.getMaps().pipe(
    tap(() => logger.info('requesting maps')),
    map((maps) =>
      maps.filter(
        (map) =>
          !!map.resourceLocationId &&
          map.mapResources.length > 0 &&
          locationIds.includes(map.resourceLocationId.toString())
      )
    ),
    map((maps) =>
      maps.reduce((obj, entry) => {
        obj[entry.resourceLocationId] = [
          ...(obj[entry.resourceLocationId] || []),
          ...entry.mapResources.map((resources) => ({
            ...resources,
            mapId: entry.mapId.toString()
          }))
        ];
        return obj;
      }, {} as Record<string, (MapResource & { mapId: string })[]>)
    ),
    delay(1000),
    combineLatestWith(
      client.getResourceLocations().pipe(
        tap(() => logger.info('requesting resource locations')),
        map((resourceLocations) =>
          resourceLocations.filter((resourceLocation) =>
            locationIds.includes(resourceLocation.resourceLocationId.toString())
          )
        ),
        map(
          (resourceLocations) =>
            Object.fromEntries(
              resourceLocations.map((resourceLocation) => [
                [resourceLocation.resourceLocationId],
                resourceLocation
              ])
            ) as Record<string, ResourceLocation>
        )
      )
    ),
    shareReplay()
  );

  return mapsResourceLocations$.pipe(
    concatMap(([maps, resourceLocations]) =>
      from(locationIds).pipe(
        concatMap((locationId) =>
          from(mergedDateRanges).pipe(
            map((dateRange) => ({
              locationId,
              dateRange,
              maps,
              resourceLocations
            })),
            delay(1000)
          )
        )
      )
    ),
    tap(({ locationId, dateRange }) => {
      logger.info(`Emitting ${locationId}, ${JSON.stringify(dateRange)}`);
    }),
    concatMap(({ maps, resourceLocations, locationId, dateRange }) =>
      client
        .getAvailabilityCards({
          bookingCategoryId: 0,
          resourceLocationId: locationId,
          equipmentCategoryId: equipmentId,
          subEquipmentCategoryId: subEquipmentId,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          nights,
          filterData: [],
          partySize: 1,
          preferWeekends: preferWeekend ?? false,
          seed: new Date()
        })
        .pipe(
          map((res) => res.filter((resAv) => resAv.dateRanges.length > 0)),
          concatMap((resAvs) =>
            resAvs.flatMap((resAv) =>
              resAv.dateRanges.map(
                (dateRange): ComposeAvailabilityOutput => ({
                  ...dateRange,
                  start: dateTimeToDate(dateRange.start),
                  end: dateTimeToDate(dateRange.end),
                  resourceLocationId: locationId,
                  resourceId: resAv.resourceId,
                  resourceLocationName:
                    resourceLocations[locationId].localizedValues[0]
                      .shortName!!,
                  mapId: maps[locationId].find(
                    (resource) =>
                      resource.resourceId.toString() ===
                      resAv.resourceId.toString()
                  )!!.mapId,
                  nights,
                  equipmentId,
                  subEquipmentId
                })
              )
            )
          )
        )
    ),
    filter((availability) =>
      dateRanges.some(
        (dateRange) =>
          availability.start === dateRange.startDate &&
          availability.end === dateRange.endDate
      )
    )
  );
}
