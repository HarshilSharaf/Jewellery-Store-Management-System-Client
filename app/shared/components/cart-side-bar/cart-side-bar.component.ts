import { Component, OnInit, effect } from '@angular/core';

import { CartSideBarService } from '../../services/cart-side-bar.service';
import { CartItemsComponent } from '../cart-items/cart-items.component';

@Component({
  selector: 'app-cart-side-bar',
  templateUrl: './cart-side-bar.component.html',
  styleUrls: ['./cart-side-bar.component.scss'],
  standalone: true,
  imports: [CartItemsComponent]
})
export class CartSideBarComponent implements OnInit {
  isOpen = false;

  constructor(private cartSidebarService: CartSideBarService) {
    effect(() => {
      this.isOpen = this.cartSidebarService.toggleSideBar();
    });
  }

  ngOnInit(): void {}

  close(): void {
    this.isOpen = false;
    this.cartSidebarService.toggleSideBar.set(false);
  }

  onBackdropClick(): void {
    this.close();
  }
}
