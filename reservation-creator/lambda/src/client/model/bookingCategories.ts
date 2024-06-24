export interface LocalizedValue {
    cultureName: string;
    name: string;
    description?: string;
    unitName?: string;
    unitNamePlural?: string;
}

export interface VehicleCollectionRequirements {
    collectVehicles: boolean;
    licensePlateCollectionRequirement: number;
    regionCollectionRequirement: number;
    yearCollectionRequirement: number;
    makeCollectionRequirement: number;
    modelCollectionRequirement: number;
    colourCollectionRequirement: number;
    jurisdictionCollectionRequirement: number;
    lengthCollectionRequirement: number;
    descriptionCollectionRequirement: number;
    maxVehicles: number;
    requiresVehicle: boolean;
}

export interface BoatCollectionRequirements {
    collectBoats: boolean;
    nameCollectionRequirement: number;
    registrationCollectionRequirement: number;
    lengthCollectionRequirement: number;
    widthCollectionRequirement: number;
    draftCollectionRequirement: number;
    typeCollectionRequirement: number;
    descriptionCollectionRequirement: number;
}

export interface RegistrationActionRequirement {
    registrationAction: number;
    isActive: boolean;
    equipmentCollectionRequirement: number;
    bookingHolderCollectionRequirement: number;
    entryPointCollectionRequirement: number;
    exitPointCollectionRequirement: number;
    equipmentDescriptionCollectionRequirement: number;
    organizationNameCollectionRequirement: number;
    partyMemberNameCollectionRequirement: number;
    partyMemberAgeCollectionRequirement: number;
    partyMemberNoteCollectionRequirement: number;
    partyMemberCapacityCategoryCollectionRequirement: number;
    partyMemberDateCollectionRequirement: number;
    contactCollectionRequirement: number;
    partyMemberContactCollectionRequirement: number;
    trailerInformationCollectionRequirement: number;
    vehicleCollectionRequirements: VehicleCollectionRequirements;
    boatCollectionRequirements: BoatCollectionRequirements;
}

export interface DefinedDurations {
    days: any[];
    times: any[];
}

export interface AllowedEquipmentCategory {
    equipmentCategoryId: number;
    subEquipmentCategoryId: number;
}

export interface MaxBookingLengthOverride {
    effectiveStartDate: string | null;
    effectiveEndDate: string | null;
    maxDays: number | null;
    bookingCategoryMaxBookingLengthOverrideId: number;
    resourceLocationOverrides: {
        maxDays: number;
        resourceLocationId: number;
    }[];
}

export interface VehiclePolicyLocalizedValue {
    cultureName: string;
    policy: string | null;
    policyHtml: string | null;
}

export interface BookingCategory {
    versionId: number;
    versionDate: string;
    isDisabled: boolean;
    bookingCategoryId: number;
    bookingModel: number;
    capacityCategoryId: number;
    additionalCapacityCategoryId: number | null;
    deferCapacityCategoryCollection: boolean;
    localizedValues: LocalizedValue[];
    allowAvailabilityNotifications: boolean;
    allowSelfCheckIn: boolean;
    allowSelfCheckOut: boolean;
    allowFlexibleDates: boolean;
    allowedResourceCategoryIds: number[];
    allowsFilterAttributes: boolean;
    filterAttributeIds: number[];
    allowedEquipmentCategories: AllowedEquipmentCategory[];
    allowedRateCategoryIds: number[];
    registrationActionRequirements: RegistrationActionRequirement[];
    printPass: number;
    printPermitForAllPartyMembers: boolean;
    permitFormatType: number;
    printableAgreements: any[];
    agreementCopiesToPrint: number;
    allowItineraryMode: boolean;
    collectArrivalComment: boolean;
    requiresUniqueBookingHolder: boolean;
    occupantCanOverlapOtherCategories: boolean;
    requiresBookingCustomer: boolean;
    restrictDelayDepartureDate: boolean;
    maxBookingLengthDays: number | null;
    maxBookingLengthTime: string | null;
    maxCapacity: number | null;
    maxBookingLengthOverrides: MaxBookingLengthOverride[];
    maxStayWindows: any[];
    automaticConfirmationEmail: boolean;
    resourceAttributesRequiringAcknowledgment: number[];
    defaultFixedLengthSearchDate: string | null;
    bookingCategoryVisibility: number;
    bookingCategorySurveys: any[];
    disallowChange: boolean;
    requiresConsentToRelease: boolean;
    enforceVehiclePolicyAcknowledgement: boolean;
    vehiclePolicyLocalizedValues: VehiclePolicyLocalizedValue[];
    selfCheckOutResourceLocationIds: number[];
    definedDurations: DefinedDurations;
    definedDurationDateOverrides: any[];
    definedDurationResourceLocationOverrides: any[];
}