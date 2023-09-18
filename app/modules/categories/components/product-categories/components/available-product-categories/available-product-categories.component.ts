import { Component, Input, OnInit } from '@angular/core';
import { ProductCategoriesModel } from '../../../../models/categories-model';

@Component({
  selector: 'app-available-product-categories',
  templateUrl: './available-product-categories.component.html',
  styleUrls: ['./available-product-categories.component.scss']
})
export class AvailableProductCategoriesComponent implements OnInit {

  page = 1;
  pageSize = 4;
  _categoriesData: ProductCategoriesModel[] = []
  lengthOfData!: number
  @Input() set categoriesData(data: ProductCategoriesModel[]) {
    this._categoriesData = data
    this.lengthOfData = this._categoriesData.length
    this.changeCategoryDataToBeShown()
  }
  dataToBeShown: ProductCategoriesModel[] = []
  constructor() { }

  ngOnInit(): void {
  }

  changeCategoryDataToBeShown() {
    this.dataToBeShown = this._categoriesData.slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize,
    );
  }


}
