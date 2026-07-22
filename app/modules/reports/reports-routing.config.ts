import { Routes } from '@angular/router';

export const reportsRoutes: Routes = [
  { path: '',               loadComponent: () => import('./components/reports-landing/reports-landing.component').then(m => m.ReportsLandingComponent) },
  { path: 'day-book',       loadComponent: () => import('./components/day-book/day-book.component').then(m => m.DayBookComponent) },
  { path: 'sales-register', loadComponent: () => import('./components/sales-register/sales-register.component').then(m => m.SalesRegisterComponent) },
  { path: 'stock-summary',  loadComponent: () => import('./components/stock-summary/stock-summary.component').then(m => m.StockSummaryComponent) },
  { path: 'gstr1',          loadComponent: () => import('./components/gstr1-export/gstr1-export.component').then(m => m.Gstr1ExportComponent) },
];
