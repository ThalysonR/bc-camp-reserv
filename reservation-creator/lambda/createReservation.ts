import { ScheduledEvent, ScheduledHandler } from 'aws-lambda';
import {
  getComposedAvailability,
  getReservationConfigRecordById,
  logger,
  makeReservation,
  putReservationConfigRecord,
  ReservationConfigRecord,
  ReservationResult
} from './src';
import { catchError, concat, map, of, toArray } from 'rxjs';
import * as reservationDetails from './reservationDetails.json';

export const handler: ScheduledHandler = async (event: ScheduledEvent) => {
  const body = event.detail;
  const json: { id: string } = JSON.parse(body);
  const input = await getReservationConfigRecordById(json.id);
  if (!!input) {
    concat(
      input.map((config) =>
        makeReservation({
          source$: getComposedAvailability({ ...config }),
          ...config,
          authDetails: reservationDetails.authDetails
        })
          .pipe(
            map((result) => ({ result, id: config.id })),
            catchError(() =>
              of({ result: 'FAILURE' as ReservationResult, id: config.id })
            ),
            toArray()
          )
          .subscribe(async (results) => {
            const succeeded = results.filter(
              (reservResult) => reservResult.result === 'SUCCESS'
            );
            let failed: ReservationConfigRecord = [];
            if (succeeded.length > 0) {
              const failed = input.filter((storedConfig) =>
                results.some(
                  (reservResult) =>
                    reservResult.id === storedConfig.id &&
                    reservResult.result === 'FAILURE'
                )
              );
              await putReservationConfigRecord(json.id, failed);
            }
            logger.info(
              `Execution Summary. Succeeded: ${succeeded.length}. Failed: ${failed.length}`
            );
          })
      )
    );
  } else {
    logger.info('No configuration found');
  }
};
