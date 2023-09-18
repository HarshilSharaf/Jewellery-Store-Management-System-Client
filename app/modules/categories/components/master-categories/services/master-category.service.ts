import { Injectable } from '@angular/core';
import { DbMasterCategoriesService } from 'Backend/Categories/MasterCategories/db-master-categories.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MasterCategoryService {

  constructor(private dbMasterCategoryService: DbMasterCategoriesService) { }

  getMasterCategories():Observable<any> {
   return this.dbMasterCategoryService.getMasterCategories()
  }

  addMasterCategory(categoryDetails:any): Observable<any> {
    return this.dbMasterCategoryService.addMasterCategory(categoryDetails.masterCategoryName, categoryDetails.masterCategoryDescription)
  }
}
