export enum PaymentType {
    CASH = 'cash',
    CHEQUE = 'cheque',
    ONLINE = 'online',
    UPI = 'upi',
    CARD = 'card'
}

export interface PaymentsDataModel {
    amount: number,
    id?: number,
    paymentGuid?: string,
    paymentType: PaymentType,
    refNumber?: string | null,
    receivedOn: Date,
    reconciledAt?: Date | null,
    remarks?: string,
}
