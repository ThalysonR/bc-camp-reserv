import { transformAvailabilityRequest } from './helper';
import {
  AvailabilityRequest,
  ResourcesAvailability
} from './model/availability';
import { BookingCategory } from './model/bookingCategories';
import { CapacityCategory } from './model/capacity';
import { Cart } from './model/cart';
import { EquipmentCategory } from './model/equipments';
import { Culture } from './model/locales';
import { ParkMap } from './model/map';
import { RateCategory } from './model/rateCategory';
import { Resources } from './model/resource';
import { ResourceCategory } from './model/resourceCategory';
import { ResourceLocation } from './model/resourceLocation';
import { BookingCategoryGroup } from './model/searchCriteria';
import { logger } from '../log';
import { from, Observable, tap } from 'rxjs';

type HeadersMap = Record<string, string>;
type HttpMethod = 'POST' | 'GET';

export class BcCampingClient {
  private BASE_URL = 'https://camping.bcparks.ca/api/';

  constructor(
    private readonly fetch: (
      input: RequestInfo | URL,
      init?: RequestInit | undefined
    ) => Promise<Response>
  ) {}

  private fetchJson({
    endpoint,
    headers,
    body,
    method
  }: {
    endpoint: string;
    headers?: HeadersMap;
    body?: any;
    method?: HttpMethod;
  }): Observable<any> {
    logger.debug(`Request URL: ${endpoint}`);
    return from(
      this.fetch(this.BASE_URL + endpoint, {
        headers,
        ...(method && { method }),
        ...(body && { body: JSON.stringify(body) })
      }).then((res) => res.json())
    ).pipe(tap(() => logger.debug(`Received response for ${endpoint}`)));
  }

  getServerTime(headers?: HeadersMap): Observable<string> {
    return this.fetchJson({
      endpoint: 'transactionlocation/servertime',
      headers
    });
  }

  getTimezoneOffset(now: string, headers?: HeadersMap): Observable<number> {
    return this.fetchJson({
      endpoint: `transactionlocation/timezoneoffset?now=${now}`,
      headers
    });
  }

  getShoppingCartTimeout(headers?: HeadersMap): Observable<number> {
    return this.fetchJson({ endpoint: 'config/shoppingcarttimeout', headers });
  }

  getWebTransactionLocationId(headers?: HeadersMap): Observable<number> {
    return this.fetchJson({
      endpoint: 'config/webtransactionlocationid',
      headers
    });
  }

  getWebResourceLocationId(headers?: HeadersMap): Observable<number> {
    return this.fetchJson({
      endpoint: 'config/webresourcelocationid',
      headers
    });
  }

  getLocales(headers?: HeadersMap): Observable<Culture[]> {
    return this.fetchJson({ endpoint: 'locales', headers });
  }

  getBookingCategories(headers?: HeadersMap): Observable<BookingCategory[]> {
    return this.fetchJson({ endpoint: 'bookingcategories', headers });
  }

  getEnableAvailabilityNotifications(
    headers?: HeadersMap
  ): Observable<boolean> {
    return this.fetchJson({
      endpoint: 'config/enableAvailabilityNotifications',
      headers
    });
  }

  getSearchCriteria(headers?: HeadersMap): Observable<BookingCategoryGroup[]> {
    return this.fetchJson({ endpoint: 'searchcriteriatabs', headers });
  }

  getEquipment(headers?: HeadersMap): Observable<EquipmentCategory[]> {
    return this.fetchJson({ endpoint: 'equipment', headers });
  }

  getCart(headers?: HeadersMap): Observable<Cart> {
    return this.fetchJson({ endpoint: 'cart', headers });
  }

  getCapacityCategories(headers?: HeadersMap): Observable<CapacityCategory[]> {
    return this.fetchJson({
      endpoint: 'capacitycategory/capacitycategories',
      headers
    });
  }

  getMaps(headers?: HeadersMap): Observable<ParkMap[]> {
    return this.fetchJson({ endpoint: 'maps', headers });
  }

  getResourceLocations(headers?: HeadersMap): Observable<ResourceLocation[]> {
    return this.fetchJson({ endpoint: 'resourceLocation', headers });
  }

  postCartCommit(
    body: { cart: Cart; isCompleted: boolean },
    headers?: HeadersMap
  ): Observable<string> {
    return this.fetchJson({
      endpoint: 'cart/commit',
      headers,
      body,
      method: 'POST'
    });
  }

  getRateCategories(headers?: HeadersMap): Observable<RateCategory[]> {
    return this.fetchJson({ endpoint: 'ratecategory/ratecategories', headers });
  }

  getResourceInfo(
    resourceLocationId: string,
    headers?: HeadersMap
  ): Observable<Resources> {
    return this.fetchJson({
      endpoint: `resourcelocation/resources?resourceLocationId=${resourceLocationId}`,
      headers
    });
  }

  getAvailabilityCards(
    request: AvailabilityRequest,
    headers?: HeadersMap
  ): Observable<ResourcesAvailability> {
    return this.fetchJson({
      endpoint: `availability/cards?${new URLSearchParams(
        transformAvailabilityRequest(request)
      )}`,
      headers: {
        ...headers,
        'content-type': 'application/json'
      },
      body: [],
      method: 'POST'
    });
  }

  getResourceCategories(headers?: HeadersMap): Observable<ResourceCategory[]> {
    return this.fetchJson({ endpoint: 'resourcecategory', headers });
  }
}
