import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription } from 'rxjs';
import { ProductCategoryService } from './services/product-category.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { ProductCategoriesModel } from '../../models/categories-model';

@Component({
  selector: 'app-product-categories',
  templateUrl: './product-categories.component.html',
  styleUrls: ['./product-categories.component.scss']
})
export class ProductCategoriesComponent implements OnInit {

  getproductCategoriesSubscription: Subscription = new Subscription;

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

    this.loaderService.start()
    this.getproductCategoriesSubscription = this.productCategoryService.getProductCategories().subscribe({
      next: (response: ProductCategoriesModel[]) => {
        this.productCategoriesData = [...response]
        this.loaderService.stop()
        this.loggerService.LogInfo("getProductCategoriesData() Request Completed From product-categories component.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getProductCategoriesData() From product-categories component")
        this.loaderService.stop()
      }
    })
  }

  ngOnDestroy(): void {
    this.getproductCategoriesSubscription.unsubscribe()
  }
}
