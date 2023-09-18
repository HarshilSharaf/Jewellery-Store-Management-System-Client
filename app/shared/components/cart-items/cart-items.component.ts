import { Component, OnInit } from '@angular/core';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-items',
  templateUrl: './cart-items.component.html',
  styleUrls: ['./cart-items.component.scss']
})
export class CartItemsComponent implements OnInit {

  public cartItems:any

  constructor(private cartService:CartService) { }

  ngOnInit(): void {
    this.cartService.getProducts().subscribe((data)=> {
      this.cartItems = data
    })
  }

  removeItem(productDetails:any) {
    this.cartService.removeCartItem(productDetails)
  }

}
