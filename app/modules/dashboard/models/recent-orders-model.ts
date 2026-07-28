import { CustomerDetails } from "../../customers/models/customerDetails";

export interface RecentOrdersModel {
    id: number,
    invoiceGuid: string,
    invoiceNumber?: string,
    customerDetails?: CustomerDetails,
    customer_details?: CustomerDetails,
    createdAt: Date,
    cancelledAt?: Date | null,
    isPaymentDone: number | boolean,
    grandTotal?: number,
    totalAmountWithGst?: number,
    totalLineItems?: number,
    total_products?: number,
    remarks?: string,
    soldToCustomer?: number,
    updatedAt?: Date
}
