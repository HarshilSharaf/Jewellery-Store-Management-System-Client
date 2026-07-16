import { Routes } from '@angular/router';
import { AuthGuard } from './guards/AuthGuard/auth.guard';

export const routes: Routes = [
  {
    path: "",
    loadChildren: () => import('./modules/main/main-routing.config').then(m => m.mainRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login-routing.config').then(m => m.loginRoutes),
  },
  {
    path: 'settings',
    loadChildren: () => import('./modules/settings/settings-routing.config').then(m => m.settingsRoutes)
  }
];
