import { Component, OnDestroy, OnInit } from '@angular/core';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { MasterCategoryService } from './services/master-category.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { MasterCategoriesModel } from '../../models/categories-model';
import { AddMasterCategoryFormComponent } from './components/add-master-category-form/add-master-category-form.component';
import { AvailableMasterCategoriesComponent } from './components/available-master-categories/available-master-categories.component';

@Component({
  selector: 'app-master-categories',
  templateUrl: './master-categories.component.html',
  styleUrls: ['./master-categories.component.scss'],
  standalone: true,
  imports: [AddMasterCategoryFormComponent, AvailableMasterCategoriesComponent]
})
export class MasterCategoriesComponent implements OnInit,OnDestroy {

  isLoading = false;

  constructor(
    private masterCategoryService: MasterCategoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService
  ) {}

  masterCategoriesData: MasterCategoriesModel[] = []

  ngOnInit(): void {
    this.getMasterCategoriesData()
  }

  getMasterCategoriesData(){
    this.loggerService.LogInfo("getMasterCategoriesData() Request Started From master-categories component.")
    this.isLoading = true;

    this.loaderService.start()
    this.masterCategoryService.getMasterCategories()
      .then((response:MasterCategoriesModel[]) => {
        this.masterCategoriesData = [...response]
        this.loggerService.LogInfo("getMasterCategoriesData() Request Completed From master-categories component.")
        this.isLoading = false;
        this.loaderService.stop()
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getMasterCategoriesData() From master-categories component")
        this.isLoading = false;
        this.loaderService.stop()
      })
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }

}
