import { Component, OnInit } from '@angular/core';
import { CartSideBarService } from 'src/app/shared/services/cart-side-bar.service';
import { CartService } from 'src/app/shared/services/cart.service';

@Component({
  selector: 'app-add-to-cart',
  templateUrl: './add-to-cart.component.html',
  styleUrls: ['./add-to-cart.component.scss']
})
export class AddToCartComponent implements OnInit {

  public totalItems = 0
  animateCartIcon = false
  constructor(private cartService: CartService, private cartSideBarService: CartSideBarService) { }

  ngOnInit(): void {
    this.cartService.getProducts().subscribe((res) => {
      this.totalItems = res.length
      setTimeout(() => {
        this.animateCartIcon = true
      }, 10000);
      this.animateCartIcon = false
    })
  }

  openCartDetails() {
    this.cartSideBarService.toggleCartSideBar()
  }

}
