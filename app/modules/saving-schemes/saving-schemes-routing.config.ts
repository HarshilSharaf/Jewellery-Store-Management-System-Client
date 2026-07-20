import { Routes } from '@angular/router';
import { SavingSchemesPageComponent } from './components/saving-schemes-page/saving-schemes-page.component';
import { SavingSchemeDetailComponent } from './components/saving-scheme-detail/saving-scheme-detail.component';

export const savingSchemesRoutes: Routes = [
  {
    path: '',
    component: SavingSchemesPageComponent,
  },
  {
    path: ':schemeGuid',
    component: SavingSchemeDetailComponent,
  },
];
