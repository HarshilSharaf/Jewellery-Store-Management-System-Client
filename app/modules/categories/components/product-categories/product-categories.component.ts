import { Component, OnInit, OnDestroy } from '@angular/core';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProductCategoryService } from './services/product-category.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { ProductCategoriesModel } from '../../models/categories-model';
import { AddProductCategoryFormComponent } from './components/add-product-category-form/add-product-category-form.component';
import { AvailableProductCategoriesComponent } from './components/available-product-categories/available-product-categories.component';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss'],
  standalone: true,
  imports: [AddProductCategoryFormComponent, AvailableProductCategoriesComponent]
})
export class ProductCategoriesComponent implements OnInit,OnDestroy {

  isLoading = false;
  constructor(
    private productCategoryService: ProductCategoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService
  ) {}

  productCategoriesData: ProductCategoriesModel[] = []

  ngOnInit(): void {
    this.getProductCategoriesData()
  }

  getProductCategoriesData(){
    this.loggerService.LogInfo("getProductCategoriesData() Request Started From product-categories component.")
    this.isLoading = true;
    this.loaderService.start()
    this.productCategoryService.getProductCategories()
      .then((response: ProductCategoriesModel[]) => {
        this.productCategoriesData = [...response]
        this.isLoading = false;
        this.loaderService.stop()
        this.loggerService.LogInfo("getProductCategoriesData() Request Completed From product-categories component.")
      })
      .catch((error: any) => {
        this.isLoading = false;
        this.loggerService.LogError(error, "getProductCategoriesData() From product-categories component")
        this.loaderService.stop()
      })
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }
}
