import type { MakingMode } from '../../../interfaces/Shared/cart';

export interface ProductDataModel {
    id: number;
    productGuid: string;
    sku: string;
    huid?: string | null;
    purityCode: string;
    purityLabel?: string;
    metalType?: 'gold' | 'silver' | 'platinum';
    purityFineness?: number;
    productDescription?: string | null;
    grossWeight: number;
    netWeight: number;
    stoneWeight: number;
    stoneCharges: number;
    makingMode: MakingMode;
    makingValue: number;
    wastagePercent: number;
    costPrice?: number;
    tagPrice: number;
    hsnCode: string;
    image?: string;
    imagePath?: string | null;
    createdAt?: string;
    isSold?: boolean | 0 | 1;
    masterCategory?: string;
    subCategory?: string;
    productCategory?: string;
    masterCategoryId?: number;
    subCategoryId?: number;
    productCategoryId?: number;
}
