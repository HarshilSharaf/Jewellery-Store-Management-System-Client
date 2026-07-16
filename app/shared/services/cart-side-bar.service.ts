import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartSideBarService {

  toggleSideBar = signal<boolean>(false)
  constructor() { }

  toggleCartSideBar() {
    this.toggleSideBar.set(true)
  }

  getCartSideBarStatus() {
    return this.toggleSideBar.asReadonly()
  }
}
