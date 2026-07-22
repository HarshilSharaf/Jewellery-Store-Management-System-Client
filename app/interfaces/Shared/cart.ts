export type MakingMode = 'flat' | 'perGram' | 'percent';

export type LineType = 'product' | 'oldGold' | 'stone' | 'labour';

export interface TaxSlab {
  hsnCode: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
}

export interface CartLineInput {
  productId?: number | null;
  lineType?: LineType;
  description?: string | null;
  hsnCode?: string;
  purityCode?: string;
  grossWeight: number;
  netWeight: number;
  stoneWeight?: number;
  ratePerGram: number;
  makingMode: MakingMode;
  makingValue: number;
  wastagePercent: number;
  stoneCharges?: number;
  discountAmount?: number;
}

export interface CartLineTotals {
  metalValue: number;
  makingCharge: number;
  stoneCharge: number;
  wastageCharge: number;
  discountAmount: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  lineTotal: number;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export type CartLineComputed = Omit<CartLineInput, 'discountAmount'> & CartLineTotals;

export interface OldGoldReceiptInput {
  grossWeight: number;
  testedPurityCode?: string | null;
  testedPurityPercent?: number | null;
  deductionPercent: number;
  ratePerGram: number;
  creditAmount: number;
  remarks?: string | null;
}

export interface ComputeCartOptions {
  shopStateCode: string;
  invoicePlaceOfSupplyStateCode: string;
  taxSlabsByHsn: Record<string, TaxSlab>;
  oldGoldCreditAmount?: number;
  roundOff?: boolean;
}

export interface CartTotals {
  lines: CartLineComputed[];
  subTotalTaxable: number;
  totalMakingCharge: number;
  totalStoneCharge: number;
  totalWastageCharge: number;
  totalDiscount: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  oldGoldCreditAmount: number;
  roundOffAmount: number;
  grandTotal: number;
}
