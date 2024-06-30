import {
  BcCampingClient,
  fromNotification,
  getComposedAvailability,
  initializeLog,
  logger,
  makeReservation,
  ReservationResult
} from './src';
import * as reservationDetails from './defaultReservationDetails.json';
import {
  catchError,
  concatMap,
  filter,
  iif,
  lastValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  take,
  tap,
  throwIfEmpty
} from 'rxjs';
import { SESEvent, SESHandler } from 'aws-lambda';

export const handler: SESHandler = async (event): Promise<any> => {
  initializeLog({
    level: 'info'
  });
  logger.info('Running createReservationFromNotification');
  const subject = getSubject(event);
  const fallbackFlow$ = fallbackProcess(subject);
  const primaryFlow$: Observable<ReservationResult> = fromNotification(
    reservationDetails
  ).pipe(
    catchError((e) => {
      logger.error(e, 'Failed reservation from notification');
      return fallbackFlow$;
    })
  );

  const reservationProcess$ = iif(
    () => isAccountOwner(event),
    primaryFlow$,
    fallbackFlow$
  );

  return await lastValueFrom(reservationProcess$);
};

function isAccountOwner(event: SESEvent) {
  return event.Records.some((record) =>
    record.ses.mail.headers.some(
      (header) =>
        header.name.toLowerCase() === 'from' &&
        header.value.toLowerCase() === reservationDetails.authDetails.email
    )
  );
}

function getSubject(event: SESEvent): string {
  return (
    event.Records.filter((record) =>
      record.ses.mail.headers.some(
        (header) => header.name.toLowerCase() === 'subject'
      )
    )
      .flatMap((record) =>
        record.ses.mail.headers.filter(
          (header) => header.name.toLowerCase() === 'subject'
        )
      )
      .at(0)
      ?.value?.toLowerCase() ??
    (() => {
      logger.info('Could not get email subject.');
      throw new Error('No subject');
    })()
  );
}

function fallbackProcess(subject: string): Observable<ReservationResult> {
  const client = new BcCampingClient(fetch);
  const resourceLocations$ = client.getResourceLocations().pipe(shareReplay());
  return resourceLocations$.pipe(
    tap(() => logger.info('Falling back to secondary flow.')),
    concatMap((res) => res),
    filter(
      (resL) =>
        !!resL.localizedValues.at(0)?.shortName &&
        subject.includes(resL.localizedValues.at(0)?.shortName?.toLowerCase()!)
    ),
    throwIfEmpty(() => {
      logger.info(`Couldnt find  any location for subject: ${subject}`);
      return new Error(`No location found for subject: ${subject}`);
    }),
    take(1),
    tap((loc) =>
      logger.info(
        {
          name: loc.localizedValues.at(0)?.shortName,
          id: loc.resourceLocationId
        },
        'Location found'
      )
    ),
    map((location) =>
      getComposedAvailability({
        ...reservationDetails,
        locationIds: [location.resourceLocationId.toString()]
      })
    ),
    concatMap((availability$) =>
      makeReservation({
        ...reservationDetails,
        source$: availability$
      })
    ),
    catchError(() => of('FAILURE' as ReservationResult))
  );
}
