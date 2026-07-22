export interface TaxSlabRow {
  id?: number;
  hsnCode: string;
  name?: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  active?: 0 | 1;
  effectiveFrom?: string;
}
