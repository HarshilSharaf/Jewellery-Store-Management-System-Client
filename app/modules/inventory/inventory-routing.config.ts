import { Routes } from '@angular/router';
import { InventoryPageComponent } from './components/inventory-page/inventory-page.component';
import { ViewProductDetailsComponent } from './components/view-product-details/view-product-details.component';

export const inventoryRoutes: Routes = [
  {
    path: '',
    component: InventoryPageComponent
  },
  {
    path: 'view-product-details/:productGuid',
    component: ViewProductDetailsComponent
  }
];
