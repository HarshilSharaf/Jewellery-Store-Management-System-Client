import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CategoriesRoutingModule } from './categories-routing.module';
import { CategoriesPageComponent } from './components/categories-page/categories-page.component';
import { MasterCategoriesComponent } from './components/master-categories/master-categories.component';
import { AddMasterCategoryFormComponent } from './components/master-categories/components/add-master-category-form/add-master-category-form.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AvailableMasterCategoriesComponent } from './components/master-categories/components/available-master-categories/available-master-categories.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { SubCategoriesComponent } from './components/sub-categories/sub-categories.component';
import { AddSubCategoryFormComponent } from './components/sub-categories/components/add-sub-category-form/add-sub-category-form.component';
import { AvailableSubCategoriesComponent } from './components/sub-categories/components/available-sub-categories/available-sub-categories.component';
import { ProductCategoriesComponent } from './components/product-categories/product-categories.component';
import { AddProductCategoryFormComponent } from './components/product-categories/components/add-product-category-form/add-product-category-form.component';
import { AvailableProductCategoriesComponent } from './components/product-categories/components/available-product-categories/available-product-categories.component';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [
    CategoriesPageComponent,
    MasterCategoriesComponent,
    AddMasterCategoryFormComponent,
    AvailableMasterCategoriesComponent,
    SubCategoriesComponent,
    AddSubCategoryFormComponent,
    AvailableSubCategoriesComponent,
    ProductCategoriesComponent,
    AddProductCategoryFormComponent,
    AvailableProductCategoriesComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbPaginationModule,
    CategoriesRoutingModule,
    SharedModule
  ]
})
export class CategoriesModule { }
