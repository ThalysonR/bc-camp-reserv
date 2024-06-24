import { LocalizedValue } from "./bookingCategories";

export interface Photo {
    url: string;
    aspectType: number;
  }
  
  export interface AllowedEquipment {
    item1: number;
    item2: number;
  }
  
  export interface DefinedAttribute {
    value?: number;
    values?: number[];
    attributeDefinitionId: number;
    attributeId: number;
    attributeVisibility: number;
  }
  
  export interface CustomAttributeLocalizedValue {
    cultureName: string;
    name: string;
    value: string;
  }
  
  export interface CustomAttribute {
    localizedValues: CustomAttributeLocalizedValue[];
    attributeId: number;
    attributeVisibility: number;
  }
  
  export interface Resource {
    photos: Photo[];
    resourceId: number;
    versionId: number;
    versionDate: string;
    isDisabled: boolean;
    resourceLocationId: number;
    resourceCategoryId: number;
    feeScheduleId: number;
    dateScheduleId: number;
    dateScheduleOverrides: any[];
    localizedValues: LocalizedValue[];
    order: number;
    maxStay: number | null;
    maxStayIsAggregate: number | null;
    minCapacity: number;
    maxCapacity: number;
    maxAdultCapacity: number;
    maxBoatDraft: number | null;
    minBoatLength: number | null;
    maxBoatLength: number | null;
    slipWidth: number | null;
    resourceModel: number;
    nonSiteSpecificSettings: any | null;
    zoneCapacitySettings: any | null;
    linkedResources: any[];
    linkedParents: any[];
    geographyIds: any[];
    surchargeIds: number[];
    reservableTransactionLocationIds: number[];
    allowedEquipment: AllowedEquipment[];
    definedAttributes: DefinedAttribute[];
    customAttributes: CustomAttribute[];
    barcodes: any[];
    dateScheduleIds: number[];
  }
  
  export interface Resources {
    [resourceId: number]: Resource;
  }