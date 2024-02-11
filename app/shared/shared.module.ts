import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { FooterComponent } from './components/footer/footer.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { ProfileDropdownComponent } from './components/navbar/profile-dropdown/profile-dropdown.component';
import { RouterModule } from '@angular/router';
import { MaterialModule } from '../material/material.module';
import { InfoCardComponent } from './components/info-card/info-card.component';
import { AddToCartComponent } from './components/navbar/add-to-cart/add-to-cart.component';
import { CartSideBarComponent } from './components/cart-side-bar/cart-side-bar.component';
import { CartItemsComponent } from './components/cart-items/cart-items.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { SkeletonLoaderComponent } from './components/skeleton-loader/skeleton-loader.component';




@NgModule({
  declarations: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    ProfileDropdownComponent,
    InfoCardComponent,
    AddToCartComponent,
    CartSideBarComponent,
    CartItemsComponent,
    PageHeaderComponent,
    DataTableComponent,
    SkeletonLoaderComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    CollapseModule.forRoot(),
    NgxSkeletonLoaderModule.forRoot({
      animation: 'pulse'
    })
  ],
  exports: [
    FooterComponent,
    NavbarComponent,
    SidebarComponent,
    ProfileDropdownComponent,
    InfoCardComponent,
    CartSideBarComponent,
    CartItemsComponent,
    PageHeaderComponent,
    DataTableComponent,
    SkeletonLoaderComponent
  ]
})
export class SharedModule { }
