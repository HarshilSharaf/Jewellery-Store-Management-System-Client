import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  cartItemList:any = localStorage.getItem('cart_items') ? JSON.parse(localStorage.getItem('cart_items') ?? '') : []
  productList = new BehaviorSubject<any>([])

  constructor() { }

  getProducts() {
    this.productList.next(this.cartItemList)
    return this.productList.asObservable()
  }

  setProduct(product:any) {
    this.cartItemList.push(product)
    this.productList.next(product)
  }

  addToCart(productDetails:any) {
    this.cartItemList.push(productDetails)
    localStorage.setItem('cart_items',JSON.stringify(this.cartItemList))
    this.productList.next(this.cartItemList)
  }

  removeCartItem(product:any) {
    this.cartItemList.map((item:any,index:any)=>{
      if(product.id === item.id)
      {
        this.cartItemList.splice(index,1)
      }
    })
    localStorage.setItem('cart_items',JSON.stringify(this.cartItemList))
    this.productList.next(this.cartItemList)
  }

  emptyCart() {
    this.cartItemList = []
    localStorage.setItem('cart_items',JSON.stringify(this.cartItemList))
    this.productList.next(this.cartItemList)
  }
}
