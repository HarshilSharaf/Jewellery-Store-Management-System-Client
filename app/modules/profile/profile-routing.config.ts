import { Routes } from '@angular/router';

export const profileRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/profile-page/profile-page.component').then(m => m.ProfilePageComponent)
  }
];
