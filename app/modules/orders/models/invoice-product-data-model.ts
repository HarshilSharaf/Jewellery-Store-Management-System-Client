import type { CartLineComputed, LineType, MakingMode } from '../../../interfaces/Shared/cart';
import { ProductDataModel } from './product-data-model';

/**
 * A cart / invoice line view-model. Wraps the base product with the
 * per-line user-editable + computed fields defined by A's cart-totals engine.
 */
export interface InvoiceProductDataModel extends ProductDataModel {
    lineType?: LineType;
    description?: string | null;
    ratePerGram: number;
    metalValue?: number;
    makingCharge?: number;
    stoneCharge?: number;
    wastageCharge?: number;
    discountAmount?: number;
    taxableAmount?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    lineTotal?: number;
    finalAmount?: number;
}

export type CartLine = CartLineComputed;
export type CartLineMakingMode = MakingMode;
