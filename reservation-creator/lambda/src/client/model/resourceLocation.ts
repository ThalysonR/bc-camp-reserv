import { MapLocalizedValue } from "./map";

export interface LocalizationPoint {
    justification: number;
    xCoordinate: number;
    yCoordinate: number;
    rValue: number;
    gValue: number;
    bValue: number;
}

export interface MapResource {
    resourceId: number;
    iconType: number;
    localizationPoint: LocalizationPoint;
    xCoordinate: number;
    yCoordinate: number;
    registrationActions: any[];
    transactionLocationTypes: any[];
}

export interface ResourceLocation {
    isOrganizationRoot: boolean;
    mapId: number;
    versionId: number;
    versionDate: string;
    mapType: number;
    isDisabled: boolean;
    xDimension: number;
    yDimension: number;
    localizedValues: MapLocalizedValue[];
    resourceLocationId: number;
    mapResources: MapResource[];
    mapAccessPointResources: any[];
    mapLegendItems: any[];
    mapLinks: any[];
    mapLabels: any[];
    parentMaps: number[];
    mapGlobalStyleLegends: any[];
    parentTransactionLocationId: number;
}