import { PaymentsDataModel } from "./payments-data-model";

export enum PaymentStatus {
    PENDING = 'pending',
    DONE = 'done'
}

export interface OrdersDataModel {
    orderId: number,
    orderGuid: string,
    orderDate: Date,
    customerFullName: string,
    customerId: number,
    customerGuid: string,
    payments: PaymentsDataModel[]
    paymentStatus: PaymentStatus,
    isPaymentDone: boolean,
    remarks?: string,
    totalAmountWithGst: number,
    totalAmountWithoutGstAndDiscount: number,
    totalDiscount: number,
    totalGst: number,
    totalLabour: number,
    cancelledAt?: Date
}
