import { PaymentsDataModel } from "./payments-data-model";

export enum PaymentStatus {
    PENDING = 'pending',
    DONE = 'done'
}

export interface OrdersDataModel {
    orderId: number,
    orderGuid: string,
    invoiceNumber?: string,
    hsn?: string,
    placeOfSupply?: string,
    orderDate: Date,
    customerFullName: string,
    customerId: number,
    customerGuid: string,
    payments: PaymentsDataModel[],
    paymentStatus: PaymentStatus,
    isPaymentDone: boolean,
    remarks?: string,
    totalAmountWithGst?: number | string | null,
    totalAmountWithoutGstAndDiscount?: number,
    subTotalTaxable?: number,
    totalCgst?: number,
    totalSgst?: number,
    totalIgst?: number,
    totalMakingCharge?: number,
    totalStoneCharge?: number,
    totalWastageCharge?: number,
    totalDiscount?: number,
    oldGoldCreditAmount?: number,
    roundOffAmount?: number,
    grandTotal?: number,
    cancelledAt?: Date,
    cancelReason?: string,
    isEinvoice?: boolean,
    irn?: string | null,
    qrCodeData?: string | null,
    totalGst?: number,
    totalLabour?: number
}
