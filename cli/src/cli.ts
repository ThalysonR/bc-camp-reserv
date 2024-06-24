import { program } from 'commander';
import Table from 'cli-table3';
import {
  BcCampingClient,
  ComposeAvailabilityInput
} from 'reservation-creator';
import { initializeLog } from 'reservation-creator';
import { makeReservation } from 'reservation-creator';
import { getComposedAvailability } from 'reservation-creator';
import { toArray } from 'rxjs';
import { reservationDetails } from 'reservation-creator';

const client = new BcCampingClient(fetch);
let debug;

program
  .name('bc-camps-util')
  .description('CLI to get bc camps api data')
  .option('-d, --debug', 'enable debug level logs')
  .version('1.0.0')
  .on('option:debug', () => {
    debug = true;
  })
  .hook('preAction', () =>
    initializeLog({
      level: debug ? 'debug' : 'info'
    })
  );

program
  .command('equipment')
  .description('fetch equipment data')
  .action(async () => {
    client.getEquipment().subscribe((eqp) => {
      const table = new Table({
        head: [
          'Equipment name',
          'Equipment ID',
          'Sub Equipment Name',
          'Sub Equipment ID'
        ],
        colWidths: [30, 30, 30, 30]
      });
      eqp.forEach((item) =>
        item.subEquipmentCategories.forEach((subEqp) => {
          table.push([
            item.localizedValues[0].name,
            item.equipmentCategoryId,
            subEqp.localizedValues[0].name,
            subEqp.subEquipmentCategoryId
          ]);
        })
      );
      console.log(table.toString());
    });
  });

program
  .command('resource-category')
  .description('fetch resource category data')
  .action(async () => {
    client.getResourceCategories().subscribe((resCat) => {
      const table = new Table({
        head: ['Resource Category name', 'Resource ID'],
        colWidths: [50, 30]
      });
      resCat.forEach((res) => {
        table.push([res.localizedValues[0].name, res.resourceCategoryId]);
      });
      console.log(table.toString());
    });
  });

program
  .command('resource-location')
  .description('fetch resource location data')
  .action(async () => {
    client.getResourceLocations().subscribe((resLoc) => {
      const sortedResLoc = resLoc.sort((a, b) =>
        a.localizedValues[0].shortName.localeCompare(
          b.localizedValues[0].shortName
        )
      );
      const table = new Table({
        head: ['Resource Location name', 'Resource Location ID'],
        colWidths: [50, 30]
      });
      sortedResLoc.forEach((res) => {
        table.push([res.localizedValues[0].shortName, res.resourceLocationId]);
      });
      console.log(table.toString());
    });
  });

program
  .command('availability')
  .description('get resource availability')
  .requiredOption('-l, --location-ids [ids...]', 'resource location id')
  .requiredOption('-e, --equipment-id <id>', 'equipment category id')
  .requiredOption('-se, --sub-equipment-id <id>', 'sub equipment category id')
  .requiredOption(
    '-dr, --date-ranges [ranges...]',
    'date ranges in yyyy-mm-dd_yyyy-mm-dd format'
  )
  .requiredOption('-n, --nights <number>', 'number of nights')
  .option('-pw, --prefer-weekend', 'prefer weekend?')
  .action(
    async ({
      locationIds,
      equipmentId,
      subEquipmentId,
      nights,
      dateRanges,
      preferWeekend
    }: Omit<ComposeAvailabilityInput, 'dateRanges'> & {
      dateRanges: string[];
    }) => {
      console.log(dateRanges);
      const input: ComposeAvailabilityInput = {
        locationIds,
        equipmentId,
        subEquipmentId,
        nights,
        dateRanges: dateRanges.map((range) => ({
          startDate: range.split('_')[0],
          endDate: range.split('_')[1]
        })),
        preferWeekend
      };
      const composedAvailability$ = getComposedAvailability(input);
      composedAvailability$.pipe(toArray()).subscribe((availabilities) => {
        const table = new Table({
          head: [
            'Resource Location Name',
            'Resource Location ID',
            'Resource ID',
            'Map ID',
            'Start',
            'End',
            'Duration'
          ],
          colWidths: [20, 20, 20, 20, 25, 25, 20]
        });
        availabilities.forEach((res) => {
          table.push([
            res.resourceLocationName,
            res.resourceLocationId,
            res.resourceId,
            res.mapId,
            res.start,
            res.end,
            res.duration
          ]);
        });
        console.log(table.toString());
      });
    }
  );

program
  .command('reserve')
  .description('make reservation')
  .action(async () => {
    const source$ = getComposedAvailability({
      locationIds: ['-2147483497'],
      equipmentId: '-32768',
      subEquipmentId: '-32767',
      dateRanges: [
        {
          startDate: '2024-07-18',
          endDate: '2024-07-19'
        }
      ],
      nights: '1',
      preferWeekend: false,
    });
    await makeReservation({
      source$,
      partyInfo: {
        adults: 4
      },
      cardDetails: {
        expiringMonth: 12,
        expiringYear: 2026,
        nameOnCard: 'Thalyson Rocha',
        number: 123456789,
        securityCode: 1234
      },
      authDetails: reservationDetails.authDetails,
      retryDetails: {
        retryIntervalInSecs: 2,
        retryTimeInMins: 2
      }
    });
  });

program.parse();
