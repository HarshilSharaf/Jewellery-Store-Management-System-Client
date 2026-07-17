import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartSideBarService {

  toggleSideBar = signal<boolean>(false)
  constructor() { }

  toggleCartSideBar() {
    this.toggleSideBar.update(open => !open);
  }

  openCartSideBar() {
    this.toggleSideBar.set(true);
  }

  closeCartSideBar() {
    this.toggleSideBar.set(false);
  }

  getCartSideBarStatus() {
    return this.toggleSideBar.asReadonly()
  }
}
