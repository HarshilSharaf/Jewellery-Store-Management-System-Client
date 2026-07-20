import { Component, HostListener, OnInit, effect } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';

import { CartSideBarService } from '../../services/cart-side-bar.service';
import { CartItemsComponent } from '../cart-items/cart-items.component';

@Component({
  selector: 'app-cart-side-bar',
  templateUrl: './cart-side-bar.component.html',
  styleUrls: ['./cart-side-bar.component.scss'],
  standalone: true,
  imports: [CartItemsComponent, RouterLink, NgIcon],
  viewProviders: [provideIcons({ lucideX })],
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

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.close();
  }
}
