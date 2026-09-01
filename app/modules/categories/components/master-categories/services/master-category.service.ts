import { Injectable, inject } from '@angular/core';
import { DbMasterCategoriesService } from 'Backend/Categories/MasterCategories/db-master-categories.service';

@Injectable({
  providedIn: 'root'
})
export class MasterCategoryService {
  private dbMasterCategoryService = inject(DbMasterCategoriesService);


  getMasterCategories(): Promise<any> {
   return this.dbMasterCategoryService.getMasterCategories();
  }

  addMasterCategory(categoryDetails: any): Promise<any> {
    return this.dbMasterCategoryService.addMasterCategory(categoryDetails.masterCategoryName, categoryDetails.masterCategoryDescription);
  }
}
