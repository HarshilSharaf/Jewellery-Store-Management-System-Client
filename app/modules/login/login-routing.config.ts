import { Routes } from '@angular/router';

export const loginRoutes: Routes = [
  {
    path: "",
    loadComponent: () => import('./components/login.component').then(m => m.LoginComponent)
  }
];
