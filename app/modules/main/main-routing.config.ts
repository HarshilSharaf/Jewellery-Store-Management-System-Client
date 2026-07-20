import { Routes } from '@angular/router';
import { AuthGuard } from '../../guards/AuthGuard/auth.guard';
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
    canActivate: [AuthGuard]
  },
  {
    path: 'customers',
    component: MainComponent,
    loadChildren: () => import('../customers/customers-routing.config').then(m => m.customersRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'categories',
    component: MainComponent,
    loadChildren: () => import('../categories/categories-routing.config').then(m => m.categoriesRoutes),
    canActivate: [AuthGuard]
  },
  {
    path:'inventory',
    component: MainComponent,
    loadChildren: ()=> import('../inventory/inventory-routing.config').then(m => m.inventoryRoutes),
    canActivate: [AuthGuard]
  },
  {
    path:'orders',
    component: MainComponent,
    loadChildren: ()=> import('../orders/orders-routing.config').then(m => m.ordersRoutes),
    canActivate: [AuthGuard]
  },
  {
    path:'profile',
    component: MainComponent,
    loadChildren: ()=> import('../profile/profile-routing.config').then(m => m.profileRoutes),
    canActivate: [AuthGuard]
  },
  {
    path:'settings',
    component: MainComponent,
    loadChildren: ()=> import('../settings/settings-routing.config').then(m => m.settingsRoutes),
    canActivate: [AuthGuard, permissionGuard('canEditShopSettings')]
  },
  {
    path:'reports',
    component: MainComponent,
    loadChildren: ()=> import('../reports/reports-routing.config').then(m => m.reportsRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'saving-schemes',
    component: MainComponent,
    loadChildren: () => import('../saving-schemes/saving-schemes-routing.config').then(m => m.savingSchemesRoutes),
    canActivate: [AuthGuard]
  },
  {
    path: 'karigar',
    component: MainComponent,
    loadChildren: () => import('../karigar/karigar-routing.config').then(m => m.karigarRoutes),
    canActivate: [AuthGuard]
  }
];
