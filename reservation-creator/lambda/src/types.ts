import { Observable } from 'rxjs';
import { MapResource } from './client/model/map';
import { ResourceLocation } from './client/model/resourceLocation';

export type ReservationResult = 'SUCCESS' | 'FAILURE';

export interface CreateReservation {
  source$: Observable<ComposeAvailabilityOutput>;
  partyInfo: PartyInfo;
  cardDetails: CardDetails;
  authDetails: AuthDetails;
  retryDetails?: RetryDetails;
}

export interface ReservationDetails {
  cardDetails: CardDetails;
  partyInfo: PartyInfo;
  retryDetails?: RetryDetails;
}

export interface PartyInfo {
  adults: number;
}

export interface CardDetails {
  number: number;
  nameOnCard: string;
  securityCode: number;
  expiringMonth: number;
  expiringYear: number;
}

export interface RetryDetails {
  retryTimeInMins?: number;
  retryIntervalInSecs?: number;
}

export interface AuthDetails {
  email: string;
  password: string;
}

export interface ComposeAvailabilityInput {
  locationIds: string[];
  equipmentId: string;
  subEquipmentId: string;
  dateRanges: SearchDateRange[];
  nights: string;
  preferWeekend?: boolean;
  mapsResourceLocation$?: Observable<[ComposedMaps, ComposedResourceLocations]>;
}

export type ComposedMaps = Record<string, (MapResource & { mapId: string })[]>;
export type ComposedResourceLocations = Record<string, ResourceLocation>;

export interface SearchDateRange {
  startDate: string;
  endDate: string;
}

export interface ComposeAvailabilityOutput {
  start: string;
  end: string;
  fixedStartDay: number;
  fixedEndDay: number;
  duration: string;
  resourceLocationId: string;
  resourceId: number;
  resourceLocationName: string;
  mapId: string;
  nights: string;
  equipmentId: string;
  subEquipmentId: string;
  retryDetails?: RetryDetails;
}

export type ReservationConfig = ComposeAvailabilityInput &
  ReservationDetails & {
    id: string;
  };

export type ReservationConfigRecord = ReservationConfig[];
