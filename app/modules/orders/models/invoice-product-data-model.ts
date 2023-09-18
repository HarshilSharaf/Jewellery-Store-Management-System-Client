import { ProductDataModel } from "./product-data-model";

export interface InvoiceProductDataModel extends ProductDataModel {
    labour?: number,
    price?: number,
    SGST?: number,
    CGST?: number,
    totalGST?: number
    discount?: number
    finalAmount?: number
}
