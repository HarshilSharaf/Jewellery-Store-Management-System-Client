import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InventoryPageComponent } from './components/inventory-page/inventory-page.component';
import { ViewProductDetailsComponent } from './components/view-product-details/view-product-details.component';

const routes: Routes = [
{
  path: '',
  component: InventoryPageComponent
},
{
  path:"view-product-details/:productGuid",
  component:ViewProductDetailsComponent
}

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class InventoryRoutingModule { }
