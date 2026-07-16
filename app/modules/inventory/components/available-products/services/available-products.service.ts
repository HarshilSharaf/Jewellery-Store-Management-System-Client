import { Injectable } from '@angular/core';
import { DbCategoriesService } from 'Backend/Categories/db-categories.service';
import { DbInventoryService } from 'Backend/Inventory/db-inventory.service';

@Injectable({
  providedIn: 'root'
})
export class AvailableProductsService {

  constructor(private dbCategoriesService: DbCategoriesService, private dbInventoryService: DbInventoryService) { }

  getAllCategories(): Promise<any> {
    return this.dbCategoriesService.getAllCategories();
  }

  getAllProductsData(itemsPerPage: number, pageNumber = 1, searchQuery: string = '', fetchSoldProducts = 0): Promise<any> {
    return this.dbInventoryService.getAllProducts(itemsPerPage, pageNumber, searchQuery, fetchSoldProducts);
  }

  addProduct(addProductFormData: any): Promise<any> {
    return this.dbInventoryService.addProduct(addProductFormData);
  }

  deleteProduct(productGuid: string, hardDelete = 0): Promise<any> {
    return this.dbInventoryService.deleteProduct(productGuid, hardDelete);
  }

  updateProductDetails(updateProductDetailsFormData: any): Promise<any> {
    return this.dbInventoryService.updateProductDetails(updateProductDetailsFormData);
  }

  getProductDetails(productGuid: string): Promise<any> {
    return this.dbInventoryService.getProductDetails(productGuid);
  }

  getProductImage(productGuid: string): Promise<any> {
    return this.dbInventoryService.getProductImage(productGuid);
  }

  deleteProductImage(productGuid: string): Promise<any> {
    return this.dbInventoryService.deleteProductImage(productGuid);
  }

  updateProductImage(productDetails: any): Promise<any> {
    return this.dbInventoryService.updateProductImage(productDetails.productGuid, productDetails.image);
  }
}
