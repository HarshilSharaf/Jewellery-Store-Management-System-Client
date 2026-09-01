import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleMinus } from '@ng-icons/lucide';

import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-items',
  templateUrl: './cart-items.component.html',
  styleUrls: ['./cart-items.component.scss'],
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideCircleMinus })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemsComponent implements OnInit {
  private cartService = inject(CartService);


  public cartItems = computed(() => this.cartService.getProducts()());

  ngOnInit(): void {
  }

  removeItem(productDetails:any) {
    this.cartService.removeCartItem(productDetails)
  }

}
