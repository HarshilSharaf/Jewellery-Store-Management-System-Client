import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription } from 'rxjs';
import { SubCategoryService } from './services/sub-category.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { SubCategoriesModel } from '../../models/categories-model';

@Component({
  selector: 'app-sub-categories',
  templateUrl: './sub-categories.component.html',
  styleUrls: ['./sub-categories.component.scss']
})
export class SubCategoriesComponent implements OnInit {

  getSubCategoriesSubscription: Subscription = new Subscription;
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
    this.getSubCategoriesSubscription = this.subCategoryService.getSubCategories().subscribe({
      next: (response: SubCategoriesModel[]) => {
        this.subCategoriesData = [...response]
        this.isLoading = false;
        this.loaderService.stop()
        this.loggerService.LogInfo("getSubCategories() Request Completed From sub-categories component.")
      },
      error: (error) => {
        this.isLoading = false;
        this.loggerService.LogError(error, "getSubCategories() From sub-categories component")
        this.loaderService.stop()
      }
    })
  }

  ngOnDestroy(): void {
    this.getSubCategoriesSubscription.unsubscribe()
  }


}
