import { LocalizedValue } from "./bookingCategories";

export interface SubEquipmentCategory {
    subEquipmentCategoryId: number;
    order: number;
    isActive: boolean;
    localizedValues: LocalizedValue[];
}

export interface EquipmentCategory {
    versionId: number;
    versionDate: string;
    isDisabled: boolean;
    equipmentCategoryId: number;
    order: number;
    localizedValues: LocalizedValue[];
    subEquipmentCategories: SubEquipmentCategory[];
}