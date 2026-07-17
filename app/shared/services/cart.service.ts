import { Injectable, signal } from '@angular/core';

const CART_STORAGE_KEY = 'cart_items';

@Injectable({
  providedIn: 'root'
})
export class CartService {

  readonly productList = signal<any[]>(this.readInitialCart());

  constructor() { }

  getProducts() {
    return this.productList.asReadonly();
  }

  setProduct(product: any) {
    const updatedCart = [...this.productList(), product];
    this.persist(updatedCart);
    this.productList.set(updatedCart);
  }

  addToCart(productDetails: any) {
    const updatedCart = [...this.productList(), productDetails];
    this.persist(updatedCart);
    this.productList.set(updatedCart);
  }

  removeCartItem(product: any) {
    const updatedCart = this.productList().filter((item: any) => product.id !== item.id);
    this.persist(updatedCart);
    this.productList.set(updatedCart);
  }

  emptyCart() {
    this.persist([]);
    this.productList.set([]);
  }

  private persist(items: any[]) {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage may be unavailable (private mode / quota); silently ignore
      // so cart operations never throw on the caller.
    }
  }

  private readInitialCart(): any[] {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(CART_STORAGE_KEY);
    } catch {
      return [];
    }
    if (!raw) {
      return [];
    }
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      // Malformed JSON in storage — clear it and start fresh rather than
      // crashing the app on every route change.
      try { localStorage.removeItem(CART_STORAGE_KEY); } catch { /* ignore */ }
      return [];
    }
  }
}
