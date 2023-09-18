import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { OrdersRoutingModule } from './orders-routing.module';
import { OrdersPageComponent } from './components/orders-page/orders-page.component';
import { PrepareOrderComponent } from './components/prepare-order/prepare-order.component';
import { MaterialModule } from 'src/app/material/material.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StepperComponent } from './components/prepare-order/components/stepper/stepper.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { SelectCustomerComponent } from './components/prepare-order/components/select-customer/select-customer.component';
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap';
import { NgbTypeaheadModule } from '@ng-bootstrap/ng-bootstrap';
import { CreateInvoiceComponent } from './components/prepare-order/components/create-invoice/create-invoice.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { OrderProductsDetailsComponent } from './components/order-products-details/order-products-details.component';
import { OrderPaymentsComponent } from './components/order-payments/order-payments.component';
import { PrintInvoiceComponent } from './components/print-invoice/print-invoice.component';
import { NgxPrintModule } from 'ngx-print';


@NgModule({
  declarations: [
    OrdersPageComponent,
    PrepareOrderComponent,
    StepperComponent,
    SelectCustomerComponent,
    CreateInvoiceComponent,
    OrderDetailsComponent,
    OrderProductsDetailsComponent,
    OrderPaymentsComponent,
    PrintInvoiceComponent
  ],
  imports: [
    CommonModule,
    SharedModule,
    MaterialModule,
    NgbPaginationModule,
    NgbTypeaheadModule,
    FormsModule,
    ReactiveFormsModule,
    OrdersRoutingModule,
    NgxPrintModule
  ]
})
export class OrdersModule { }
