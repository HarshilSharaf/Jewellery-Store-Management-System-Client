import { Routes } from '@angular/router';

export const categoriesRoutes: Routes = [
  { path: '', redirectTo: 'master', pathMatch: 'full' },
  { path: 'master',  loadComponent: () => import('./components/categories-page/categories-page.component').then(m => m.CategoriesPageComponent), data: { tab: 'master' } },
  { path: 'product', loadComponent: () => import('./components/categories-page/categories-page.component').then(m => m.CategoriesPageComponent), data: { tab: 'product' } },
  { path: 'sub',     loadComponent: () => import('./components/categories-page/categories-page.component').then(m => m.CategoriesPageComponent), data: { tab: 'sub' } },
];
