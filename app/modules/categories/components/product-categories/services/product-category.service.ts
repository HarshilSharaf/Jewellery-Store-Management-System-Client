import { Injectable } from '@angular/core';
import { DbProductCategoriesService } from 'Backend/Categories/ProductCategories/db-product-categories.service';

@Injectable({
  providedIn: 'root'
})
export class ProductCategoryService {

  constructor( private dbProductCategoriesService:DbProductCategoriesService) { }


  getTopProductCategories(numberOfCategories = 5):Promise<any> {
    return this.dbProductCategoriesService.getTopProductCategories(numberOfCategories)
  }

  getProductCategories():Promise<any> {
   return this.dbProductCategoriesService.getProductCategories()
  }

  addProductCategory(categoryDetails:any): Promise<any> {
    return this.dbProductCategoriesService.addProductCategory(categoryDetails.productCategoryName, categoryDetails.productCategoryDescription)
  }
}
