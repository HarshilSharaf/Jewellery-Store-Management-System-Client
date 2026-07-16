import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  readonly productList = signal<any[]>(
    localStorage.getItem('cart_items') ? JSON.parse(localStorage.getItem('cart_items') ?? '') : []
  );

  constructor() { }

  getProducts() {
    return this.productList.asReadonly();
  }

  setProduct(product:any) {
    this.productList.update(items => [...items, product]);
  }

  addToCart(productDetails:any) {
    const updatedCart = [...this.productList(), productDetails];
    localStorage.setItem('cart_items', JSON.stringify(updatedCart));
    this.productList.set(updatedCart);
  }

  removeCartItem(product:any) {
    const updatedCart = this.productList().filter((item: any) => product.id !== item.id);
    localStorage.setItem('cart_items', JSON.stringify(updatedCart));
    this.productList.set(updatedCart);
  }

  emptyCart() {
    localStorage.setItem('cart_items', JSON.stringify([]));
    this.productList.set([]);
  }
}
