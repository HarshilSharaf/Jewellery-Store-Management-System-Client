import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { OrderDetailsComponent } from './components/order-details/order-details.component';
import { OrdersPageComponent } from './components/orders-page/orders-page.component';
import { PrepareOrderComponent } from './components/prepare-order/prepare-order.component';

const routes: Routes = [
  {
    path: '',
    component: OrdersPageComponent
  },
  {
    path: 'prepare-order',
    component: PrepareOrderComponent
  },
  {
    path:"view-order-details/:orderGuid",
    component:OrderDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersRoutingModule { }
