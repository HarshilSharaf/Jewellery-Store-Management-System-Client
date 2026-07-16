import { Routes } from '@angular/router';
import { CustomersPageComponent } from './components/customers-page/customers-page.component';
import { ViewDetailsComponent } from './components/view-details/view-details.component';

export const customersRoutes: Routes = [
  {
    path: '',
    component: CustomersPageComponent
  },
  {
    path: 'view-customer-details/:customerGuid',
    component: ViewDetailsComponent
  }
];
