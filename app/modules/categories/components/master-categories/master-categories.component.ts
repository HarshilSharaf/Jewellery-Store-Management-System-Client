import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription } from 'rxjs/internal/Subscription';
import { MasterCategoryService } from './services/master-category.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { MasterCategoriesModel } from '../../models/categories-model';

@Component({
  selector: 'app-master-categories',
  templateUrl: './master-categories.component.html',
  styleUrls: ['./master-categories.component.scss']
})
export class MasterCategoriesComponent implements OnInit,OnDestroy {

  getMasterCategoriesSubscription: Subscription = new Subscription;

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

    this.loaderService.start()
    this.getMasterCategoriesSubscription = this.masterCategoryService.getMasterCategories().subscribe({
      next: (response:MasterCategoriesModel[]) => {
        this.masterCategoriesData = [...response]
        this.loggerService.LogInfo("getMasterCategoriesData() Request Completed From master-categories component.")
        this.loaderService.stop()
      },
      error: (error) => {
        this.loggerService.LogError(error, "getMasterCategoriesData() From master-categories component")
        this.loaderService.stop()
      }
    })
  }

  ngOnDestroy(): void {
    this.getMasterCategoriesSubscription.unsubscribe()
  }

}
