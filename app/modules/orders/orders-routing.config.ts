import { Routes } from '@angular/router';
import { OrdersPageComponent } from './components/orders-page/orders-page.component';
import { PrepareOrderComponent } from './components/prepare-order/prepare-order.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { PrintInvoicePreviewComponent } from './components/print-invoice-preview/print-invoice-preview.component';

export const ordersRoutes: Routes = [
  {
    path: '',
    component: OrdersPageComponent
  },
  {
    path: 'prepare-order',
    component: PrepareOrderComponent
  },
  {
    path: 'view-order-details/:orderGuid',
    component: OrderDetailsComponent
  },
  {
    path: 'print-invoice/:orderGuid',
    component: PrintInvoicePreviewComponent
  }
];
