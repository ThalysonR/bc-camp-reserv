import { LocalizedValue } from "./bookingCategories";

export interface ResourceCategory {
    resourceCategoryId: number;
    versionId: number;
    isDisabled: boolean;
    versionDate: string;
    localizedValues: LocalizedValue[];
    resourceType: number;
    showResourceCapacityOnline: boolean;
}