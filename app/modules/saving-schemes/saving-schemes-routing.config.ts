import { Routes } from '@angular/router';

export const savingSchemesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/saving-schemes-page/saving-schemes-page.component').then(m => m.SavingSchemesPageComponent),
  },
  {
    path: ':schemeGuid',
    loadComponent: () => import('./components/saving-scheme-detail/saving-scheme-detail.component').then(m => m.SavingSchemeDetailComponent),
  },
];
