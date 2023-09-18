import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartSideBarService {

  toggleSideBar = new BehaviorSubject<boolean>(false)
  constructor() { }

  toggleCartSideBar() {
    this.toggleSideBar.next(true)
  }

  getCartSideBarStatus() {
    return this.toggleSideBar.asObservable()
  }
}
