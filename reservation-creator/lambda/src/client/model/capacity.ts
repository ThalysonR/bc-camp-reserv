import { LocalizedValue } from "./bookingCategories";

export interface SubCapacityCategoryLocalizedValue {
    cultureName: string;
    name: string;
    description: string;
}

export interface SubCapacityCategory {
    subCapacityCategoryId: number;
    localizedValues: SubCapacityCategoryLocalizedValue[];
    isActive: boolean;
    isAdult: boolean;
}

export interface CapacityCategory {
    versionId: number;
    versionDate: string;
    isDisabled: boolean;
    capacityCategoryId: number;
    name: string;
    capacityCategoryType: number;
    localizedValues: LocalizedValue[];
    subCapacityCategories: SubCapacityCategory[];
}