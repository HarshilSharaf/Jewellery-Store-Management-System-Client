import type { MakingMode } from './cart';

export interface ProductRow {
  id?: number;
  productGuid?: string;
  sku: string;
  huid?: string | null;
  purityCode: string;
  productDescription?: string | null;
  grossWeight: number;
  netWeight: number;
  stoneWeight: number;
  stoneCharges: number;
  makingMode: MakingMode;
  makingValue: number;
  wastagePercent: number;
  costPrice: number;
  tagPrice: number;
  hsnCode: string;
  imagePath?: string | null;
  masterCategoryId: number;
  subCategoryId: number;
  productCategoryId: number;
  isSold?: 0 | 1;
}
