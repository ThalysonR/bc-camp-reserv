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
import {
  ComposeAvailabilityInput,
  ComposeAvailabilityOutput,
  ComposedMaps,
  ComposedResourceLocations
} from './types';
import { BcCampingClient } from './client';
import { dateTimeToDate, mergeDateRanges } from './helper';
import { logger } from './log';
import { ParkMap } from './client/model/map';
import { ResourceLocation } from './client/model/resourceLocation';

export function getComposedAvailability({
  locationIds,
  equipmentId,
  subEquipmentId,
  dateRanges,
  nights,
  preferWeekend,
  mapsResourceLocation$
}: ComposeAvailabilityInput): Observable<ComposeAvailabilityOutput> {
  const client = new BcCampingClient(fetch);
  const mergedDateRanges = mergeDateRanges(dateRanges);
  const mapsResourceLocations$ =
    mapsResourceLocation$ ?? composeMapsResourceLocations(locationIds);

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

export function composeMapsResourceLocations(
  locationIds?: string[],
  maps$?: Observable<ParkMap[]>,
  resourceLocations$?: Observable<ResourceLocation[]>
): Observable<[ComposedMaps, ComposedResourceLocations]> {
  const client = new BcCampingClient(fetch);
  return (maps$ ?? client.getMaps()).pipe(
    tap(() => logger.info('requesting maps')),
    map((maps) =>
      maps.filter(
        (map) =>
          !!map.resourceLocationId &&
          map.mapResources.length > 0 &&
          (locationIds?.includes(map.resourceLocationId.toString()) ?? true)
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
      }, {} as ComposedMaps)
    ),
    delay(1000),
    combineLatestWith(
      (resourceLocations$ ?? client.getResourceLocations()).pipe(
        tap(() => logger.info('requesting resource locations')),
        map((resourceLocations) =>
          resourceLocations.filter(
            (resourceLocation) =>
              locationIds?.includes(
                resourceLocation.resourceLocationId.toString()
              ) ?? true
          )
        ),
        map(
          (resourceLocations) =>
            Object.fromEntries(
              resourceLocations.map((resourceLocation) => [
                [resourceLocation.resourceLocationId],
                resourceLocation
              ])
            ) as ComposedResourceLocations
        )
      )
    ),
    shareReplay()
  );
}
