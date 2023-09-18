import { Injectable } from '@angular/core';
import { DbProductCategoriesService } from 'Backend/Categories/ProductCategories/db-product-categories.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {

  constructor( private dbProductCategoriesService:DbProductCategoriesService) { }


  getTopProductCategories(numberOfCategories = 5):Observable<any> {
    return this.dbProductCategoriesService.getTopProductCategories(numberOfCategories)
  }

  getProductCategories():Observable<any> {
   return this.dbProductCategoriesService.getProductCategories()
  }

  addProductCategory(categoryDetails:any): Observable<any> {
    return this.dbProductCategoriesService.addProductCategory(categoryDetails.productCategoryName, categoryDetails.productCategoryDescription)
  }
}
