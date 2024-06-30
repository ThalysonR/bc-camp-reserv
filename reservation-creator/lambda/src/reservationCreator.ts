import {
  AuthDetails,
  ComposeAvailabilityOutput,
  CreateReservation,
  ReservationDetails,
  ReservationResult
} from './types';
import chromium from '@sparticuz/chromium';
import { logger } from './log';
import {
  catchError,
  combineLatestWith,
  concatMap,
  delay,
  EMPTY,
  from,
  iif,
  map,
  Observable,
  of,
  race,
  raceWith,
  retry,
  switchMap,
  take,
  tap,
  throwIfEmpty
} from 'rxjs';
import { NoResultsError, RetryableError } from './errors';
import {
  BrowserWrapper,
  PageWrapper,
  puppeteerWrapper
} from './puppeteer.wrapper';

function asyncTap<T>(cb: (input: T) => Observable<any> | undefined) {
  return function (source: Observable<T>): Observable<T> {
    return source.pipe(
      switchMap((srcVal) => cb(srcVal)?.pipe(map(() => srcVal)) ?? of(srcVal))
    );
  };
}

function getBrowser(): Observable<BrowserWrapper> {
  chromium.setHeadlessMode = true;
  return from(chromium.executablePath()).pipe(
    concatMap((executablePath) =>
      puppeteerWrapper({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath
        // executablePath: '/usr/bin/google-chrome',
        // headless: false
      })
    )
  );
}

function login(authDetails: AuthDetails, page: PageWrapper): Observable<any> {
  const login$ = page.waitForSelector('#login').pipe(
    tap(() => logger.info('Logging in')),
    asyncTap((el) => el?.click()),
    delay(500),
    asyncTap(() =>
      page
        .$('#login-cookie-consent')
        .pipe(asyncTap((cookieBtn) => (cookieBtn ? cookieBtn.click() : EMPTY)))
    ),
    asyncTap(() =>
      page
        .waitForSelector('#email')
        .pipe(
          asyncTap((email) => email?.type(authDetails.email, { delay: 50 }))
        )
    ),
    asyncTap(() =>
      page.waitForSelector('#password').pipe(
        asyncTap((password) =>
          password?.type(authDetails.password, { delay: 50 })
        ),
        asyncTap((password) => password?.press('Enter'))
      )
    ),
    asyncTap(() => page.waitForNavigation()),
    tap(() => logger.info('Logged in successfully'))
  );

  const alreadyLoggedIn$ = page
    .waitForSelector('#welcomeButton')
    .pipe(tap(() => logger.info('Already logged in. Skipping')));
  return race(login$, alreadyLoggedIn$);
}

function reserve(
  props: ReservationDetails,
  page: PageWrapper
): Observable<ReservationResult> {
  const retryDeadline = new Date(
    Date.now() + (props.retryDetails?.retryTimeInMins || 0) * 60000
  );
  const retryIntervalInSecs = props.retryDetails?.retryIntervalInSecs ?? 15;
  const fillCard$ = () =>
    page
      .waitForSelector('#cardNumber')
      .pipe(
        asyncTap((el) =>
          el?.type(props.cardDetails.number.toString(), { delay: 50 })
        )
      );
  const happyPath$: Observable<ReservationResult> = page
    .waitForSelector('#mat-checkbox-1-input')
    .pipe(asyncTap((el) => el?.click()))
    .pipe(
      raceWith(
        page.waitForSelector('#confirmButton').pipe(
          asyncTap((el) => el?.click()),
          asyncTap(() =>
            page
              .waitForSelector('#mat-checkbox-1-input')
              .pipe(asyncTap((el) => el?.click()))
          )
        )
      ),
      tap(() => logger.info('Added to cart. Proceeding with forms')),
      asyncTap(() =>
        page
          .waitForSelector('#confirmReservationDetails')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#proceedToCheckout')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#mat-checkbox-2-input')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#confirmPolicies')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#confirmAccountDetails')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#confirmOccupant')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page.waitForSelector('#booking-1-sub-capacity-1-field').pipe(
          asyncTap((el) => el?.press('Backspace')),
          asyncTap((el) =>
            el?.type(props.partyInfo.adults.toString(), { delay: 50 })
          )
        )
      ),
      asyncTap(() =>
        page
          .waitForSelector('#partyInfoButton')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#confirmAdditionalInformation')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#addOnsOptions')
          .pipe(
            asyncTap((el) => el?.click()),
            asyncTap(() => fillCard$())
          )
          .pipe(raceWith(fillCard$()))
      ),
      asyncTap(() =>
        page
          .waitForSelector('#cardHolderName')
          .pipe(
            asyncTap((el) =>
              el?.type(props.cardDetails.nameOnCard, { delay: 50 })
            )
          )
      ),
      asyncTap(() =>
        page
          .waitForSelector('#cardExpiryMonth')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page.waitForSelector('#cardExpiryMonth-panel').pipe(
          concatMap(() =>
            page.waitForSelector(
              `xpath=//span[contains(., '${props.cardDetails.expiringMonth}')]`
            )
          ),
          asyncTap((el) => el?.click())
        )
      ),
      asyncTap(() =>
        page
          .waitForSelector('#cardExpiryYear')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(() =>
        page.waitForSelector('#cardExpiryYear-panel').pipe(
          concatMap(() =>
            page.waitForSelector(
              `xpath=//span[contains(., '${props.cardDetails.expiringYear}')]`
            )
          ),
          asyncTap((el) => el?.click())
        )
      ),
      asyncTap(() =>
        page
          .waitForSelector('#cardCvv')
          .pipe(
            asyncTap((el) =>
              el?.type(props.cardDetails.securityCode.toString(), { delay: 50 })
            )
          )
      ),
      asyncTap(() =>
        page
          .waitForSelector('#applyPaymentButton')
          .pipe(tap((el) => el?.click()))
      ),
      map(() => 'SUCCESS'),
      catchError((e) => {
        logger.error(e, 'Failed during reservation process. Exiting');
        return of('FAILURE' as ReservationResult);
      })
    ) as Observable<ReservationResult>;

  const failedPath$: Observable<ReservationResult> = of().pipe(
    asyncTap(() => {
      if (new Date() <= retryDeadline) {
        logger.info(
          `Could not add reservation. Retrying in ${retryIntervalInSecs} seconds.`
        );

        return of().pipe(
          asyncTap(() => page.reload()),
          tap(() => {
            throw new RetryableError();
          })
        );
      }
      return of('FAILURE');
    })
  );

  const successCheck$: Observable<ReservationResult> = page
    .waitForSelector('#addToStay')
    .pipe(
      asyncTap((el) => el?.click()),
      map(() => 'SUCCESS')
    );
  const failedCheck$: Observable<ReservationResult> = page
    .waitForSelector('#genericDialog')
    .pipe(map(() => 'FAILURE'));

  return race(successCheck$, failedCheck$).pipe(
    catchError((e) => {
      logger.error(e, 'Unknown error encountered. Exiting');
      return of('FAILURE');
    }),
    concatMap((result) =>
      iif(() => result === 'SUCCESS', happyPath$, failedPath$)
    ),
    retry({
      delay: retryIntervalInSecs * 1000
    })
  );
}

export function makeReservation(
  props: CreateReservation
): Observable<ReservationResult> {
  return props.source$.pipe(
    throwIfEmpty(() => new NoResultsError()),
    take(1),
    combineLatestWith(getBrowser()),
    concatMap(([input, browser]) =>
      from(browser.newPage()).pipe(
        map((page) => ({ input, browser, page })),
        asyncTap(({ page }) => page.goto('http://camping.bcparks.ca')),
        asyncTap(({ page }) => login(props.authDetails, page)),
        tap(() => logger.info('Navigating to resource page')),
        asyncTap(({ input, page }) => page.goto(createLink(input))),
        concatMap((args) =>
          reserve({ ...props, ...args.input }, args.page).pipe(
            map((result) => ({ ...args, result }))
          )
        ),
        map(({ result }) => result),
        catchError((e: Error) => {
          switch (true) {
            case e instanceof NoResultsError:
              logger.info(
                'No available dates within searched parameters. Exiting.'
              );
              break;
            default:
              logger.error(
                `Unexpected error. terminating. Stacktrace: ${e.stack}`
              );
          }
          return of('FAILURE' as ReservationResult);
        }),
        asyncTap(() => browser.close())
      )
    )
  );
}

export function fromNotification(
  reservationDetails: ReservationDetails & { authDetails: AuthDetails }
): Observable<ReservationResult> {
  const processNotification = (
    browser: BrowserWrapper
  ): Observable<ReservationResult> =>
    of(null).pipe(
      concatMap(() =>
        browser.newPage().pipe(map((page) => ({ browser, page })))
      ),
      tap(() => logger.info('Starting process from notification')),
      asyncTap(({ page }) => page.goto('http://camping.bcparks.ca')),
      asyncTap(({ page }) => login(reservationDetails.authDetails, page)),
      asyncTap(({ page }) =>
        page.goto('http://camping.bcparks.ca/account/notification-dashboard')
      ),
      asyncTap(({ page }) => page.waitForNavigation()),
      asyncTap(({ page }) =>
        page
          .waitForSelector('[id^="view-on-map"]')
          .pipe(asyncTap((el) => el?.click()))
      ),
      delay(3000),
      asyncTap(({ page }) =>
        page
          .waitForSelector('div.leaflet-marker-icon.map-icon.icon-available')
          .pipe(asyncTap((el) => el?.click()))
      ),
      asyncTap(({ page }) => reserve(reservationDetails, page)),
      catchError((e) => {
        if (e instanceof NoResultsError) {
          logger.info('No available sites found. Exiting');
        } else {
          logger.error(e, 'Error occurred. Catching to close browser');
        }
        return of('FAILURE');
      })
    ) as Observable<ReservationResult>;

  return getBrowser().pipe(
    concatMap((browser) =>
      processNotification(browser).pipe(map((result) => ({ browser, result })))
    ),
    asyncTap(({ browser }) => browser.close()),
    map(({ result }) => result)
  ) as Observable<ReservationResult>;
}

function createLink(reservationRequest: ComposeAvailabilityOutput): string {
  return `https://camping.bcparks.ca/create-booking/results?resourceLocationId=${
    reservationRequest.resourceLocationId
  }&mapId=${
    reservationRequest.mapId
  }&searchTabGroupId=0&bookingCategoryId=0&startDate=${
    reservationRequest.start
  }&endDate=${reservationRequest.end}&nights=${
    reservationRequest.nights
  }&isReserving=true&equipmentId=${
    reservationRequest.equipmentId
  }&subEquipmentId=${
    reservationRequest.subEquipmentId
  }&partySize=1&filterData=%7B%7D&searchTime=${new Date()
    .toISOString()
    .slice(0, -1)}&SRID=${reservationRequest.resourceId}`;
}
