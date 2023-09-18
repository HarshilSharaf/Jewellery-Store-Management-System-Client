import { CustomerDetails } from "../../customers/models/customerDetails";

export interface RecentOrdersModel {
    cancelledAt: Date,
    createdAt: Date,
    customer_details: CustomerDetails,
    id: number,
    invoiceGuid: string,
    isPaymentDone: number,
    remarks: string,
    soldToCustomer: number,
    total_products: number,
    totalAmountWithGst: number,
    totalAmountWithoutGstAndDiscount: number,
    totalDiscount: number,
    totalGst: number,
    totalLabour: number,
    updatedAt: Date
}