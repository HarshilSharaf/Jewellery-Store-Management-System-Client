import { Routes } from '@angular/router';

export const ordersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/orders-page/orders-page.component').then(m => m.OrdersPageComponent)
  },
  {
    path: 'prepare-order',
    loadComponent: () => import('./components/prepare-order/prepare-order.component').then(m => m.PrepareOrderComponent)
  },
  {
    path: 'view-order-details/:orderGuid',
    loadComponent: () => import('./components/order-details/order-details.component').then(m => m.OrderDetailsComponent)
  },
  {
    path: 'print-invoice/:orderGuid',
    loadComponent: () => import('./components/print-invoice-preview/print-invoice-preview.component').then(m => m.PrintInvoicePreviewComponent)
  }
];
