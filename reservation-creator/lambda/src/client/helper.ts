import { AvailabilityRequest } from "./model/availability";

export function transformAvailabilityRequest(request: AvailabilityRequest): Record<string, string> {
    return {
        resourceId: request.resourceId ? request.resourceId.toString() : 'null',
        bookingCategoryId: request.bookingCategoryId.toString(),
        resourceLocationId: request.resourceLocationId.toString(),
        equipmentCategoryId: request.equipmentCategoryId.toString(),
        subEquipmentCategoryId: request.subEquipmentCategoryId.toString(),
        numEquipment: request.numEquipment ? request.numEquipment.toString() : 'null',
        startDate: request.startDate,
        endDate: request.endDate,
        nights: request.nights.toString(),
        filterData: '[]',
        boatLength: request.boatLength ? request.boatLength.toString() : 'null',
        boatDraft: request.boatDraft ? request.boatDraft.toString() : 'null',
        boatWidth: request.boatWidth ? request.boatWidth.toString() : 'null',
        partySize: request.partySize.toString(),
        preferWeekends: request.preferWeekends.toString(),
        seed: request.seed.toISOString()
    }
}