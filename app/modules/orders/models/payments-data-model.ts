export enum PaymentType {
    CASH = 'cash',
    CHEQUE = 'cheque',
    ONLINE = 'online'
}

export interface PaymentsDataModel {
    amount: number,
    id: number,
    paymentGuid?: string,
    paymentType: PaymentType,
    receivedOn: Date,
    remarks?: string,
}
