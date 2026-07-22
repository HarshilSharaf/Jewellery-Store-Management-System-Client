import { Routes } from '@angular/router';

export const customersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/customers-page/customers-page.component').then(m => m.CustomersPageComponent)
  },
  {
    path: 'view-customer-details/:customerGuid',
    loadComponent: () => import('./components/view-details/view-details.component').then(m => m.ViewDetailsComponent)
  },
  // Guard: stale URLs like /customers/view-customer-details (missing :customerGuid)
  // used to fire NG04002 when replayed via browser back/forward navigation.
  { path: 'view-customer-details', redirectTo: '', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
