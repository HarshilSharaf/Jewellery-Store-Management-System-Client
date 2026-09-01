import { Injectable, inject } from '@angular/core';
import { DbSubCategoriesService } from 'Backend/Categories/SubCategories/db-sub-categories.service';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {
  private dbSubCategoryService = inject(DbSubCategoriesService);


  getSubCategories(): Promise<any> {
    return this.dbSubCategoryService.getSubCategories();
  }

  addSubCategory(categoryDetails: any): Promise<any> {
    return this.dbSubCategoryService.addSubCategory(categoryDetails.subCategoryName, categoryDetails.subCategoryDescription);
  }
}
