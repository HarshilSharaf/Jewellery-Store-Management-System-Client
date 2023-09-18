import { CustomerDetails } from "../../customers/models/customerDetails";
import { OrdersDataModel } from "./orders-data-model";
import {InvoiceProductDataModel} from './invoice-product-data-model'
export interface InvoiceDataModel extends OrdersDataModel {

    invoice_products: InvoiceProductDataModel[]
    customer_details: CustomerDetails,

}
