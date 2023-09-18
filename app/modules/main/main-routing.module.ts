import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '../../guards/AuthGuard/auth.guard';
import { MainComponent } from './components/main/main.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: MainComponent,
    loadChildren: () => import('../dashboard/dashboard.module').then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'customers',
    component: MainComponent,
    loadChildren: () => import('../customers/customers.module').then(m => m.CustomersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'categories',
    component: MainComponent,
    loadChildren: () => import('../categories/categories.module').then(m => m.CategoriesModule),
    canActivate: [AuthGuard]
  },
  {
    path:'inventory',
    component: MainComponent,
    loadChildren: ()=> import('../inventory/inventory.module').then(m => m.InventoryModule),
    canActivate: [AuthGuard]
  },
  {
    path:'orders',
    component: MainComponent,
    loadChildren: ()=> import('../orders/orders.module').then(m => m.OrdersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    component: MainComponent,
    loadChildren: () => import('../profile/profile.module').then(m => m.ProfileModule),
    canActivate: [AuthGuard]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MainRoutingModule { }
