import { Routes } from '@angular/router';
import { authGuard } from '../../guards/AuthGuard/auth.guard';
import { MainComponent } from './components/main/main.component';
import { permissionGuard } from '../../shared/guards/permission.guard';

export const mainRoutes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: MainComponent,
    loadChildren: () => import('../dashboard/dashboard-routing.config').then(m => m.dashboardRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'customers',
    component: MainComponent,
    loadChildren: () => import('../customers/customers-routing.config').then(m => m.customersRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'categories',
    component: MainComponent,
    loadChildren: () => import('../categories/categories-routing.config').then(m => m.categoriesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'inventory',
    component: MainComponent,
    loadChildren: () => import('../inventory/inventory-routing.config').then(m => m.inventoryRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'orders',
    component: MainComponent,
    loadChildren: () => import('../orders/orders-routing.config').then(m => m.ordersRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'profile',
    component: MainComponent,
    loadChildren: () => import('../profile/profile-routing.config').then(m => m.profileRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'settings',
    component: MainComponent,
    loadChildren: () => import('../settings/settings-routing.config').then(m => m.settingsRoutes),
    canActivate: [authGuard, permissionGuard('canEditShopSettings')]
  },
  {
    path: 'reports',
    component: MainComponent,
    loadChildren: () => import('../reports/reports-routing.config').then(m => m.reportsRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'saving-schemes',
    component: MainComponent,
    loadChildren: () => import('../saving-schemes/saving-schemes-routing.config').then(m => m.savingSchemesRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'karigar',
    component: MainComponent,
    loadChildren: () => import('../karigar/karigar-routing.config').then(m => m.karigarRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'repair',
    component: MainComponent,
    loadChildren: () => import('../repair/repair-routing.config').then(m => m.repairRoutes),
    canActivate: [authGuard]
  }
];
