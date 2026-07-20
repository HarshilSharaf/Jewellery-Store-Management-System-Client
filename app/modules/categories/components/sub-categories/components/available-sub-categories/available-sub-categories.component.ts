import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubCategoriesModel } from '../../../../models/categories-model';
import { SkeletonLoaderComponent } from '../../../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { SimplePaginatorComponent, SimplePageEvent } from '../../../../../../shared/components/simple-paginator/simple-paginator.component';

@Component({
  selector: 'app-available-sub-categories',
  templateUrl: './available-sub-categories.component.html',
  styleUrls: ['./available-sub-categories.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, SimplePaginatorComponent, SkeletonLoaderComponent]
})
export class AvailableSubCategoriesComponent implements OnInit {

  pageIndex = 0;
  pageSize = 4;
  _categoriesData: SubCategoriesModel[] = [];
  lengthOfData!: number;
  _isLoading = false;

  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
  }

  @Input() set categoriesData(data: SubCategoriesModel[]) {
    this._categoriesData = data;
    this.lengthOfData = this._categoriesData.length;
    this.changeCategoryDataToBeShown();
  }

  dataToBeShown: SubCategoriesModel[] = [];

  constructor() {}

  ngOnInit(): void {}

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.changeCategoryDataToBeShown();
  }

  changeCategoryDataToBeShown(): void {
    this.dataToBeShown = this._categoriesData.slice(
      this.pageIndex * this.pageSize,
      this.pageIndex * this.pageSize + this.pageSize,
    );
  }
}
