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
import {
  catchError,
  concat,
  concatMap,
  from,
  lastValueFrom,
  map,
  of,
  reduce,
  tap
} from 'rxjs';
import * as reservationDetails from './reservationDetails.json';

export const handler: ScheduledHandler = async (
  event: ScheduledEvent
): Promise<void> => {
  const body = event.detail;
  const json: { id: string } = JSON.parse(body);
  const input = await getReservationConfigRecordById(json.id);
  if (!!input) {
    const reservationExecution$ = concat(
      input.map((config) =>
        makeReservation({
          source$: getComposedAvailability({ ...config }),
          ...config,
          authDetails: reservationDetails.authDetails
        }).pipe(
          catchError(() =>
            of({ result: 'FAILURE' as ReservationResult, id: config.id })
          ),
          map((result) => ({ result, id: config.id }))
        )
      )
    ).pipe(
      concatMap((obs) => obs),
      reduce(
        (acc, result) => {
          result.result === 'FAILURE'
            ? acc.failures.push(result.id)
            : acc.success.push(result.id);
          return acc;
        },
        { success: [], failures: [] } as {
          success: string[];
          failures: string[];
        }
      ),
      tap((result) =>
        logger.info(
          `CreateReservation execution summary: Success = ${result.success.length}; Failures: ${result.failures.length}`
        )
      ),
      concatMap((result) => {
        if (result.success.length > 0) {
          const toUpdate: ReservationConfigRecord = input.filter(
            (storedConfig) =>
              result.failures.some((id) => id === storedConfig.id)
          );
          return from(putReservationConfigRecord(json.id, toUpdate));
        }
        return of(void 0);
      })
    );
    return await lastValueFrom(reservationExecution$);
  } else {
    logger.info('No configuration found');
  }
};
