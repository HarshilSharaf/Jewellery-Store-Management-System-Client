import { CustomerDetails } from "../../customers/models/customerDetails";
import { OrdersDataModel } from "./orders-data-model";
import { InvoiceProductDataModel } from './invoice-product-data-model';

export interface InvoiceDataModel extends OrdersDataModel {
    invoice_products?: InvoiceProductDataModel[],
    lineItems?: InvoiceProductDataModel[],
    customer_details: CustomerDetails,
    customerDetails?: CustomerDetails,
    rateSnapshot?: Record<string, number> | null,
    oldGoldReceipts?: any[] | null
}
