import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { InventoryRoutingModule } from './inventory-routing.module';
import { InventoryPageComponent } from './components/inventory-page/inventory-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { AvailableProductsComponent } from './components/available-products/available-products.component';
import { AddProductFormComponent } from './components/available-products/components/add-product-form/add-product-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { ImageUploadComponent } from './components/available-products/components/image-upload/image-upload.component';
import { MaterialModule } from 'src/app/material/material.module';
import { ViewProductDetailsComponent } from './components/view-product-details/view-product-details.component';
import { ProductImageUploadComponent } from './components/product-image-upload/product-image-upload.component';
import { ProductDetailsFormComponent } from './components/product-details-form/product-details-form.component';


@NgModule({
  declarations: [
    InventoryPageComponent,
    AvailableProductsComponent,
    AddProductFormComponent,
    ImageUploadComponent,
    ViewProductDetailsComponent,
    ProductImageUploadComponent,
    ProductDetailsFormComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    ReactiveFormsModule,
    InventoryRoutingModule
  ]
})
export class InventoryModule { }
