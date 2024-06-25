import {
  fromNotification,
  initializeLog,
  logger,
  ReservationResult
} from './src';
import * as reservationDetails from './reservationDetails.json';
import { catchError, lastValueFrom, of } from 'rxjs';

export const handler = async (): Promise<void> => {
  initializeLog({
    level: 'info'
  });
  logger.info('Running createReservationFromNotification');
  const reserveProcessing$ = fromNotification(reservationDetails).pipe(
    catchError((e) => {
      logger.error(e, 'Failed reservation from notification');
      return of('FAILURE' as ReservationResult);
    })
  );
  const result = await lastValueFrom(reserveProcessing$);
  logger.info(`Reservation from notification result: ${result}`);
};
