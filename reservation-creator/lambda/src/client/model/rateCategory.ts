export interface RateCategoryLocalizedValue {
    cultureName: string;
    name: string;
    description: string;
    verificationMessage: string | null;
}

export interface PassValidationSettings {
    requiresPassExpiryDate: boolean;
    maxLength: number | null;
    minLength: number | null;
    characterSet: number;
    prefix: string;
    suffix: string;
}

export interface RateCategory {
    rateCategoryId: number;
    versionId: number;
    localizedValues: RateCategoryLocalizedValue[];
    versionDate: string;
    isDisabled: boolean;
    order: number;
    allowedRegionIds: number[];
    allowedCountryIds: number[];
    requiresPass: boolean;
    passValidationSettings: PassValidationSettings;
    visibility: number;
}