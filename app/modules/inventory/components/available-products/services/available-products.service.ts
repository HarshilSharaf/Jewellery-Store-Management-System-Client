import { Injectable } from '@angular/core';
import { DbCategoriesService } from 'Backend/Categories/db-categories.service';
import { DbBridgeService } from '../../../../../shared/services/Db/db-bridge.service';

/**
 * Bypasses `Backend/Inventory/db-inventory.service.ts` and calls A's new SPs
 * (`add_product`, `update_product_details`, etc.) directly through the IPC
 * bridge. Categories still use the parent DbCategoriesService because their
 * signatures did not change under Workstream A.
 */
@Injectable({ providedIn: 'root' })
export class AvailableProductsService {

  constructor(private dbCategoriesService: DbCategoriesService, private db: DbBridgeService) { }

  getAllCategories(): Promise<any> {
    return this.dbCategoriesService.getAllCategories();
  }

  getAllProductsData(itemsPerPage: number, pageNumber = 1, searchQuery: string = '', fetchSoldProducts = 0): Promise<any> {
    return this.db.execute('call get_all_products(?, ?, ?, ?);', [
      fetchSoldProducts,
      itemsPerPage,
      pageNumber,
      searchQuery,
    ]);
  }

  addProduct(payload: any): Promise<any> {
    return this.db.execute(
      'call add_product(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        payload.sku,
        payload.huid || null,
        payload.purityCode,
        payload.productDescription ?? null,
        Number(payload.grossWeight) || 0,
        Number(payload.netWeight) || 0,
        Number(payload.stoneWeight) || 0,
        Number(payload.stoneCharges) || 0,
        payload.makingMode ?? 'perGram',
        Number(payload.makingValue) || 0,
        Number(payload.wastagePercent) || 0,
        Number(payload.costPrice) || 0,
        Number(payload.tagPrice) || 0,
        payload.hsnCode || '7113',
        payload.masterCategoryId,
        payload.subCategoryId,
        payload.productCategoryId,
        payload.imagePath ?? null,
      ],
    );
  }

  deleteProduct(productGuid: string, hardDelete = 0): Promise<any> {
    return this.db.execute('call delete_product(?, ?);', [hardDelete, productGuid]);
  }

  updateProductDetails(payload: any): Promise<any> {
    return this.db.execute(
      'call update_product_details(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        payload.productGuid,
        payload.sku,
        payload.huid || null,
        payload.purityCode,
        payload.productDescription ?? null,
        Number(payload.grossWeight) || 0,
        Number(payload.netWeight) || 0,
        Number(payload.stoneWeight) || 0,
        Number(payload.stoneCharges) || 0,
        payload.makingMode ?? 'perGram',
        Number(payload.makingValue) || 0,
        Number(payload.wastagePercent) || 0,
        Number(payload.costPrice) || 0,
        Number(payload.tagPrice) || 0,
        payload.hsnCode || '7113',
        payload.masterCategoryId,
        payload.subCategoryId,
        payload.productCategoryId,
      ],
    );
  }

  getProductDetails(productGuid: string): Promise<any> {
    return this.db.execute('call get_product_details(?);', [productGuid]);
  }

  getProductImage(productGuid: string): Promise<any> {
    return this.db.execute('call get_product_image(?);', [productGuid]);
  }

  deleteProductImage(productGuid: string): Promise<any> {
    return this.db.execute('call delete_product_image(?);', [productGuid]);
  }

  updateProductImage(productDetails: any): Promise<any> {
    return this.db.execute('call update_product_image(?, ?);', [productDetails.productGuid, productDetails.image]);
  }
}
