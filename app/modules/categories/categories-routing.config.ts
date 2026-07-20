import { Routes } from '@angular/router';
import { CategoriesPageComponent } from './components/categories-page/categories-page.component';

export const categoriesRoutes: Routes = [
  { path: '', redirectTo: 'master', pathMatch: 'full' },
  { path: 'master',  component: CategoriesPageComponent, data: { tab: 'master' } },
  { path: 'product', component: CategoriesPageComponent, data: { tab: 'product' } },
  { path: 'sub',     component: CategoriesPageComponent, data: { tab: 'sub' } },
];
