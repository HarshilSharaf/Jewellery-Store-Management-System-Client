import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomersRoutingModule } from './customers-routing.module';
import { CustomersPageComponent } from './components/customers-page/customers-page.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { HttpClientModule } from '@angular/common/http';
import { AddCustomerFormComponent } from './components/add-customer-form/add-customer-form.component';
import { NgxUiLoaderModule } from 'ngx-ui-loader';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import {ReactiveFormsModule} from "@angular/forms";
import { MaterialModule } from 'src/app/material/material.module';
import { ViewDetailsComponent } from './components/view-details/view-details.component';

@NgModule({
  declarations: [
    CustomersPageComponent,
    AddCustomerFormComponent,
    ImageUploadComponent,
    ViewDetailsComponent
  ],
  imports: [
    CommonModule,
    CustomersRoutingModule,
    SharedModule,
    MaterialModule,
    HttpClientModule,
    NgxUiLoaderModule,
    ReactiveFormsModule 
  ]
})
export class CustomersModule { }
