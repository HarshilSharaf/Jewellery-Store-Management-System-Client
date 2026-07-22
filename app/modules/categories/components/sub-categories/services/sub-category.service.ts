import { Injectable } from '@angular/core';
import { DbSubCategoriesService } from 'Backend/Categories/SubCategories/db-sub-categories.service';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {

  constructor(private dbSubCategoryService: DbSubCategoriesService) { }

  getSubCategories(): Promise<any> {
    return this.dbSubCategoryService.getSubCategories();
  }

  addSubCategory(categoryDetails: any): Promise<any> {
    return this.dbSubCategoryService.addSubCategory(categoryDetails.subCategoryName, categoryDetails.subCategoryDescription);
  }
}
