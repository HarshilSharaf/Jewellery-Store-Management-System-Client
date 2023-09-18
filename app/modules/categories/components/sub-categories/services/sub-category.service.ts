import { Injectable } from '@angular/core';
import { DbSubCategoriesService } from 'Backend/Categories/SubCategories/db-sub-categories.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SubCategoryService {


  constructor(private dbSubCategoryService: DbSubCategoriesService) { }

  getSubCategories(): Observable<any> {
    return this.dbSubCategoryService.getSubCategories()
  }

  addSubCategory(categoryDetails: any): Observable<any> {
    return this.dbSubCategoryService.addSubCategory(categoryDetails.subCategoryName, categoryDetails.subCategoryDescription)
  }
}