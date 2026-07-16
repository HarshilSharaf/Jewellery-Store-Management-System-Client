import { Component, OnInit, computed } from '@angular/core';

import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-items',
  templateUrl: './cart-items.component.html',
  styleUrls: ['./cart-items.component.scss'],
  standalone: true,
  imports: []
})
export class CartItemsComponent implements OnInit {

  public cartItems = computed(() => this.cartService.getProducts()());

  constructor(private cartService:CartService) { }

  ngOnInit(): void {
  }

  removeItem(productDetails:any) {
    this.cartService.removeCartItem(productDetails)
  }

}
