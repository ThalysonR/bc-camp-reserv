export interface BookingCategoryGroupLocalizedValues {
    [key: string]: string;
}

export interface ChildBookingCategoryIds {
    [key: string]: number;
}

export interface BookingCategoryGroup {
    bookingCategoryGroupId: number;
    order: number;
    bookingCategoryGroupLocalizedValues: BookingCategoryGroupLocalizedValues;
    childBookingCategoryIds: ChildBookingCategoryIds;
    iconUrl: string;
}