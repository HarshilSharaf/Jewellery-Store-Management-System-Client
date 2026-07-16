import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { CartSideBarService } from '../../../services/cart-side-bar.service';
import { CartService } from '../../../services/cart.service';

@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.scss'],
  standalone: true,
  imports: [CommonModule, MatBadgeModule]
})
export class AddToCartComponent implements OnInit {

  public totalItems = 0
  animateCartIcon = false
  
  constructor(private cartService: CartService, private cartSideBarService: CartSideBarService) {
    // React to cart items Signal changes
    effect(() => {
      const items = this.cartService.getProducts()();
      this.totalItems = items.length;
      setTimeout(() => {
        this.animateCartIcon = true
      }, 10000);
      this.animateCartIcon = false
    });
  }

  ngOnInit(): void {
  }

  openCartDetails() {
    this.cartSideBarService.toggleCartSideBar()
  }

}
