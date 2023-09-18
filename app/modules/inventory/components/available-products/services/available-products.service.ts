import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { DbCategoriesService } from 'Backend/Categories/db-categories.service';
import { DbInventoryService } from 'Backend/Inventory/db-inventory.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvailableProductsService {

  constructor(private http: HttpClient, private dbCategoriesService:DbCategoriesService, private dbInventoryService: DbInventoryService) { }

  getAllCategories(): Observable<any> {
    return this.dbCategoriesService.getAllCategories()
  }

  getAllProductsData(itemsPerPage:number, pageNumber = 1, searchQuery:string = '', fetchSoldProducts = 0): Observable<any> {
    return this.dbInventoryService.getAllProducts(itemsPerPage, pageNumber, searchQuery, fetchSoldProducts)
  }

  addProduct(addProductFormData: any): Observable<any> {
    return this.dbInventoryService.addProduct(addProductFormData)
  }

  deleteProduct(productGuid:string, hardDelete = 0):Observable<any>{
    return this.dbInventoryService.deleteProduct(productGuid,hardDelete)
  }

  updateProductDetails(updateProductDetailsFormData: any) {
    return this.dbInventoryService.updateProductDetails(updateProductDetailsFormData)
  }

  getProductDetails(productGuid:string) {
    return this.dbInventoryService.getProductDetails(productGuid)
  }

  getProductImage(productGuid: string) {
    return this.dbInventoryService.getProductImage(productGuid)
  }

  deleteProductImage(productGuid: string) {
    return this.dbInventoryService.deleteProductImage(productGuid)
  }

  updateProductImage(productDetails:any) {
    return this.dbInventoryService.updateProductImage(productDetails.productGuid,productDetails.image)
  }
}
