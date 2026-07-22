import { Injectable } from '@angular/core';
import { DbMasterCategoriesService } from 'Backend/Categories/MasterCategories/db-master-categories.service';

@Injectable({
  providedIn: 'root'
})
export class MasterCategoryService {

  constructor(private dbMasterCategoryService: DbMasterCategoriesService) { }

  getMasterCategories(): Promise<any> {
   return this.dbMasterCategoryService.getMasterCategories();
  }

  addMasterCategory(categoryDetails: any): Promise<any> {
    return this.dbMasterCategoryService.addMasterCategory(categoryDetails.masterCategoryName, categoryDetails.masterCategoryDescription);
  }
}
