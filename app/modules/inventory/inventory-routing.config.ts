import { Routes } from '@angular/router';

export const inventoryRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/inventory-page/inventory-page.component').then(m => m.InventoryPageComponent)
  },
  {
    path: 'view-product-details/:productGuid',
    loadComponent: () => import('./components/view-product-details/view-product-details.component').then(m => m.ViewProductDetailsComponent)
  }
];
