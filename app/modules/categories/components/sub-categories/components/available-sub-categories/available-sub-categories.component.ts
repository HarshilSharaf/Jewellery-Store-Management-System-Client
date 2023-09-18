import { Component, Input, OnInit } from '@angular/core';
import { SubCategoriesModel } from '../../../../models/categories-model';

@Component({
  selector: 'app-available-sub-categories',
  templateUrl: './available-sub-categories.component.html',
  styleUrls: ['./available-sub-categories.component.scss']
})
export class AvailableSubCategoriesComponent implements OnInit {

  page = 1;
  pageSize = 4;
  _categoriesData: SubCategoriesModel[] = []
  lengthOfData!: number
  @Input() set categoriesData(data: SubCategoriesModel[]) {
    this._categoriesData = data
    this.lengthOfData = this._categoriesData.length
    this.changeCategoryDataToBeShown()
  }
  dataToBeShown: SubCategoriesModel[] = []
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
