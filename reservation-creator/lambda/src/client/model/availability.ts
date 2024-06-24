export interface AvailabilityRequest {
  resourceId?: number;
  bookingCategoryId: number;
  resourceLocationId: string;
  equipmentCategoryId: string;
  subEquipmentCategoryId: string;
  numEquipment?: number;
  startDate: string;
  endDate: string;
  nights: string;
  filterData: any[];
  boatLength?: number;
  boatDraft?: number;
  boatWidth?: number;
  partySize: number;
  preferWeekends: boolean;
  seed: Date;
}

export interface DateRange {
  start: string;
  end: string;
  fixedStartDay: number;
  fixedEndDay: number;
  duration: string;
}

export interface ResourceAvailability {
  resourceId: number;
  dateRanges: DateRange[];
  hasAdditionalAvailableDateRanges: boolean;
}

export type ResourcesAvailability = ResourceAvailability[];
