import { Routes } from '@angular/router';

import { ReportsLandingComponent } from './components/reports-landing/reports-landing.component';
import { DayBookComponent } from './components/day-book/day-book.component';
import { SalesRegisterComponent } from './components/sales-register/sales-register.component';
import { StockSummaryComponent } from './components/stock-summary/stock-summary.component';
import { Gstr1ExportComponent } from './components/gstr1-export/gstr1-export.component';

export const reportsRoutes: Routes = [
  { path: '',                component: ReportsLandingComponent },
  { path: 'day-book',        component: DayBookComponent },
  { path: 'sales-register',  component: SalesRegisterComponent },
  { path: 'stock-summary',   component: StockSummaryComponent },
  { path: 'gstr1',           component: Gstr1ExportComponent },
];
