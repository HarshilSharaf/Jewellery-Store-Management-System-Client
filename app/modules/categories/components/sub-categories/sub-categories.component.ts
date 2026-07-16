import { Component, EventEmitter, OnInit, Output, OnDestroy } from '@angular/core';

import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SubCategoryService } from './services/sub-category.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { SubCategoriesModel } from '../../models/categories-model';
import { AddSubCategoryFormComponent } from './components/add-sub-category-form/add-sub-category-form.component';
import { AvailableSubCategoriesComponent } from './components/available-sub-categories/available-sub-categories.component';

@Component({
  selector: 'app-sub-categories',
  templateUrl: './sub-categories.component.html',
  styleUrls: ['./sub-categories.component.scss'],
  standalone: true,
  imports: [AddSubCategoryFormComponent, AvailableSubCategoriesComponent]
})
export class SubCategoriesComponent implements OnInit,OnDestroy {

  subCategoriesData: SubCategoriesModel[] = []
  isLoading = false;
  constructor(
    private subCategoryService: SubCategoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    this.getSubCategoriesData()
  }

  getSubCategoriesData() {
    this.loggerService.LogInfo("getSubCategories() Request Started From sub-categories component.")
    this.isLoading = true;
    this.loaderService.start()
    this.subCategoryService.getSubCategories()
      .then((response: SubCategoriesModel[]) => {
        this.subCategoriesData = [...response]
        this.isLoading = false;
        this.loaderService.stop()
        this.loggerService.LogInfo("getSubCategories() Request Completed From sub-categories component.")
      })
      .catch((error: any) => {
        this.isLoading = false;
        this.loggerService.LogError(error, "getSubCategories() From sub-categories component")
        this.loaderService.stop()
      })
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }


}
