import { Routes } from '@angular/router';
import { OrdersPageComponent } from './components/orders-page/orders-page.component';
import { PrepareOrderComponent } from './components/prepare-order/prepare-order.component';
import { OrderDetailsComponent } from './components/order-details/order-details.component';

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
  }
];
