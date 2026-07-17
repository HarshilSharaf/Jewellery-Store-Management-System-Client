import { Component, OnDestroy, effect } from '@angular/core';
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
export class AddToCartComponent implements OnDestroy {

  public totalItems = 0;
  animateCartIcon = false;
  private animationResetTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cartService: CartService, private cartSideBarService: CartSideBarService) {
    // Briefly toggle animateCartIcon so the CSS animation replays whenever
    // the cart contents change. Previously this scheduled a stray 10s
    // timeout on every update, leaking timers on rapid additions and
    // never firing the animation in the intended window.
    effect(() => {
      const items = this.cartService.getProducts()();
      this.totalItems = items.length;
      if (items.length === 0) {
        this.animateCartIcon = false;
        return;
      }
      this.animateCartIcon = true;
      if (this.animationResetTimer) {
        clearTimeout(this.animationResetTimer);
      }
      this.animationResetTimer = setTimeout(() => {
        this.animateCartIcon = false;
        this.animationResetTimer = null;
      }, 700);
    });
  }

  ngOnDestroy(): void {
    if (this.animationResetTimer) {
      clearTimeout(this.animationResetTimer);
      this.animationResetTimer = null;
    }
  }

  openCartDetails() {
    this.cartSideBarService.openCartSideBar();
  }
}
