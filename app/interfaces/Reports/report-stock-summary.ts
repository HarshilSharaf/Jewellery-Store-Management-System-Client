export interface StockSummaryByPurityRow {
  purityCode: string;
  purityLabel: string;
  metalType: 'gold' | 'silver' | 'platinum';
  fineness: number;
  unitCount: number;
  netWeightGrams: number;
  grossWeightGrams: number;
  totalTagPrice: number;
  totalCostPrice: number;
}

export interface LowStockCategoryRow {
  masterCategoryId: number;
  masterCategoryName: string;
  subCategoryId: number;
  subCategoryName: string;
  productCategoryId: number;
  productCategoryName: string;
  inStockCount: number;
  totalNetWeight: number;
}
