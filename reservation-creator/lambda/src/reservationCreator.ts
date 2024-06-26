import puppeteer, { Browser, ElementHandle, Page } from 'puppeteer-core';
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
  concatMap,
  from,
  map,
  Observable,
  of,
  retry,
  take,
  throwError,
  throwIfEmpty
} from 'rxjs';
import { NoResultsError, RetryableError } from './errors';

async function getBrowser(): Promise<Browser> {
  chromium.setHeadlessMode = true;
  return puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath: await chromium.executablePath(),
    // executablePath: '/usr/bin/google-chrome',
    headless: chromium.headless
  });
}

async function login(authDetails: AuthDetails, page: Page) {
  logger.info('Logging in');
  const { el: login, type } = await Promise.race([
    page.waitForSelector('#login').then((el) => ({ el, type: 'LOGIN' })),
    page
      .waitForSelector('#welcomeButton')
      .then((el) => ({ el, type: 'WELCOME' }))
  ]);
  if (type === 'WELCOME') {
    logger.info('Already logged in. Skipping');
    return;
  }
  login?.click();
  logger.info('Clicked login');
  await page.waitForNavigation();
  const cookieBtn = await page.$('#login-cookie-consent');
  if (cookieBtn) {
    cookieBtn.click();
  }
  const emailField = await page.waitForSelector('#email');
  await emailField?.type(authDetails.email, { delay: 50 });
  await page.type('#password', authDetails.password, { delay: 50 });
  await emailField?.press('Enter');
  await page.waitForNavigation();
  logger.info('Logged in successfully');
}

async function reserve(
  props: ReservationDetails,
  page: Page
): Promise<ReservationResult> {
  const retryDeadline = new Date(
    Date.now() + (props.retryDetails?.retryTimeInMins || 0) * 60000
  );
  const retryIntervalInSecs = props.retryDetails?.retryIntervalInSecs ?? 15;
  let element: { elem: ElementHandle<Element> | null; status: string };
  do {
    await (await page.waitForSelector('#addToStay'))?.click();
    element = await Promise.race([
      page
        .waitForSelector('#mat-checkbox-1-input')
        .then((elem) => ({ elem, status: 'SUCCESS' })),
      page
        .waitForSelector('#genericDialog')
        .then((elem) => ({ elem, status: 'FAILURE' }))
    ]);
    if (element.status == 'SUCCESS') {
      break;
    } else if (new Date() <= retryDeadline) {
      logger.info(
        `Could not add reservation. Retrying in ${retryIntervalInSecs} seconds.`
      );
      await new Promise((r) => setTimeout(r, retryIntervalInSecs * 1000));
      await page.reload();
    } else {
      logger.info('Could not add reservation. Retry limit exceeded. Exiting');
      throw new RetryableError('Could not add reservation');
    }
  } while (true);
  await element.elem?.click();
  logger.info('Added to cart. Proceeding with forms');
  await (await page.waitForSelector('#confirmReservationDetails'))?.click();
  await (await page.waitForSelector('#proceedToCheckout'))?.click();
  await (await page.waitForSelector('#mat-checkbox-2-input'))?.click();
  await (await page.waitForSelector('#confirmPolicies'))?.click();
  await (await page.waitForSelector('#confirmAccountDetails'))?.click();
  await (await page.waitForSelector('#confirmOccupant'))?.click();
  const adultsSelection = await page.waitForSelector(
    '#booking-1-sub-capacity-1-field'
  );
  await adultsSelection?.press('Backspace');
  await adultsSelection?.type(props.partyInfo.adults.toString(), { delay: 50 });
  await (await page.waitForSelector('#partyInfoButton'))?.click();
  await (await page.waitForSelector('#confirmAdditionalInformation'))?.click();
  await (await page.waitForSelector('#addOnsOptions'))?.click();
  await (
    await page.waitForSelector('#cardNumber')
  )?.type(props.cardDetails.number.toString(), { delay: 50 });
  await (
    await page.waitForSelector('#cardHolderName')
  )?.type(props.cardDetails.nameOnCard, { delay: 50 });
  await (await page.waitForSelector('#cardExpiryMonth'))?.click();
  await page.waitForSelector('#cardExpiryMonth-panel');

  await (
    await page.waitForSelector(
      `xpath=//span[contains(., '${props.cardDetails.expiringMonth}')]`
    )
  )?.click();
  await (await page.waitForSelector('#cardExpiryYear'))?.click();
  await page.waitForSelector('#cardExpiryYear-panel');
  await (
    await page.waitForSelector(
      `xpath=//span[contains(., '${props.cardDetails.expiringYear}')]`
    )
  )?.click();
  await (
    await page.waitForSelector('#cardCvv')
  )?.type(props.cardDetails.securityCode.toString(), { delay: 50 });
  await (await page.waitForSelector('#applyPaymentButton'))?.click();
  logger.info('Reservation completed successfully');
  return 'SUCCESS';
}

export function makeReservation(
  props: CreateReservation
): Observable<ReservationResult> {
  return props.source$.pipe(
    throwIfEmpty(() => new NoResultsError()),
    take(1),
    map(async (input) => {
      const browser = await getBrowser();
      try {
        const page = await browser.newPage();
        await page.goto('http://camping.bcparks.ca');
        await login(props.authDetails, page);
        logger.info('Navigating to resource page');
        await page.goto(createLink(input));
        const reserveFn = await reserve(
          {
            ...input,
            ...props
          },
          page
        );
        return reserveFn;
      } catch (e) {
        logger.error(e, 'Error occurred. Catching to close browser');
        throw e;
      } finally {
        await browser.close();
      }
    }),
    concatMap((reserveFn) => from(reserveFn)),
    catchError((e: Error) => {
      switch (true) {
        case e instanceof RetryableError:
          logger.info(
            "Could not finish reservation. Will retry if there's any attempt left"
          );
          return throwError(() => new Error('Throwing to retry'));

        case e instanceof NoResultsError:
          logger.info(
            'No available dates within searched parameters. Exiting.'
          );
          break;
        default:
          logger.error(`Unexpected error. terminating. Stacktrace: ${e.stack}`);
      }
      return of('FAILURE' as ReservationResult);
    }),
    retry(3)
  );
}

export function fromNotification(
  reservationDetails: ReservationDetails & { authDetails: AuthDetails }
) {
  return from(getBrowser()).pipe(
    map(async (browser) => {
      const page = await browser.newPage();
      try {
        logger.info('Starting process from notification');
        await page.goto('http://camping.bcparks.ca');
        await login(reservationDetails.authDetails, page);
        logger.info('Navigating to notifications page');
        await page.goto(
          'http://camping.bcparks.ca/account/notification-dashboard'
        );
        await page.waitForNavigation();
        const availableReservation = await page.$$('[id^="view-on-map"]');
        if (!availableReservation || availableReservation.length == 0) {
          logger.info('No reservation available. Exiting');
          return 'FAILURE';
        }
        logger.info('Available reservation found on notifications');
        await page.waitForNavigation();
        await (await page.$$('[data-availability="icon-available"]'))
          .at(0)
          ?.click();
        logger.info('Found available resource on map');
        return await reserve(reservationDetails, page);
      } catch (e) {
        logger.error(e, 'Error occurred. Catching to close browser');
        throw e;
      } finally {
        await browser.close();
      }
    }),
    concatMap((reserveFn) => from(reserveFn))
  );
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
