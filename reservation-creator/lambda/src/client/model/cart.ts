export interface Transaction {
    cartTransactionUid: string;
    cartUid: string;
    shopperUid: string | null;
    shiftUid: string;
    terminalLocationId: number;
    userUid: string;
    referenceNumberPrefix: string;
    referenceNumberSuffix: string;
    createDate: string;
    lastEditDate: string;
    completeDate: string | null;
    status: number;
    transactionShoppers: any[];
    transactionResourceBlockers: any[];
    transactionResourceNonSpecificBlockers: any[];
    transactionResourceZoneBlockers: any[];
    transactionResourceZoneEntryBlockers: any[];
    transactionBookings: any[];
    transactionLineItems: any[];
    transactionPayments: any[];
    transactionSales: any[];
    transactionShipments: any[];
    transactionGroupHolds: any[];
    transactionGiftCards: any[];
    transactionActivities: any[];
    editBookingLock: boolean;
}

export interface Cart {
    cartUid: string;
    createTransactionUid: string;
    shopperUid: string | null;
    groupUid: string | null;
    referenceNumberPrefix: string;
    referenceNumberSuffix: string;
    referenceNumber: string;
    newTransaction: Transaction;
    transactionDrafts: any[];
    transactionHistory: any[];
    cancellableTransactions: any[];
    giftCards: any[];
    sales: any[];
    bookings: any[];
    shipments: any[];
    groupHold: string | null;
    paymentGroups: any[];
    gatewayPaymentSessions: any[];
    lineItems: any[];
    resourceBlockers: any[];
    resourceNonSpecificBlockers: any[];
    resourceZoneBlockers: any[];
    resourceZoneEntryBlockers: any[];
    productStockQuantityBlockers: any[];
    notes: any[];
    waitlistApplications: any[];
    etag: string;
}
