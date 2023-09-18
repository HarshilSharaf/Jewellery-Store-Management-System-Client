import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CustomersPageComponent } from './components/customers-page/customers-page.component';
import { ViewDetailsComponent } from './components/view-details/view-details.component';

const routes: Routes = [
  {
    path: "",
    component: CustomersPageComponent,
  },
  {
    path:"view-customer-details/:customerGuid",
    component:ViewDetailsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CustomersRoutingModule { }
