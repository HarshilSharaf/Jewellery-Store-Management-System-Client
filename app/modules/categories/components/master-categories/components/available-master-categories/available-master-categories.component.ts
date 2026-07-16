import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MasterCategoriesModel } from '../../../../models/categories-model';
import { SkeletonLoaderComponent } from '../../../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-available-master-categories',
  templateUrl: './available-master-categories.component.html',
  styleUrls: ['./available-master-categories.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, MatPaginatorModule, SkeletonLoaderComponent]
})
export class AvailableMasterCategoriesComponent implements OnInit {

  pageIndex = 0;
  pageSize = 4;
  _categoriesData: MasterCategoriesModel[] = [];
  lengthOfData!: number;
  _isLoading = false;

  @Input() set isLoading(value: boolean) {
    this._isLoading = value;
  }

  @Input() set categoriesData(data: MasterCategoriesModel[]) {
    this._categoriesData = data;
    this.lengthOfData = this._categoriesData.length;
    this.changeCategoryDataToBeShown();
  }

  dataToBeShown: MasterCategoriesModel[] = [];

  constructor() {}

  ngOnInit(): void {}

  onPageChange(event: PageEvent): void {
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
