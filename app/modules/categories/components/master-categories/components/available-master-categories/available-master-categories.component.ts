import { AfterViewChecked, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { MasterCategoriesModel } from '../../../../models/categories-model';

@Component({
  selector: 'app-available-master-categories',
  templateUrl: './available-master-categories.component.html',
  styleUrls: ['./available-master-categories.component.scss']
})
export class AvailableMasterCategoriesComponent implements OnInit {

  page = 1;
  pageSize = 4;
  _categoriesData: MasterCategoriesModel[] = []
  lengthOfData!: number
  _isLoading = false;
  @Input() set isLoading(value: boolean)
  {
    this._isLoading = value;
  }
  @Input() set categoriesData(data: MasterCategoriesModel[]) {
    this._categoriesData = data
    this.lengthOfData = this._categoriesData.length
    this.changeCategoryDataToBeShown()
  }
  dataToBeShown: MasterCategoriesModel[] = []
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
