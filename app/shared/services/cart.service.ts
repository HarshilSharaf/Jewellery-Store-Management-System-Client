import { Injectable, signal } from '@angular/core';

const CART_STORAGE_KEY = 'cart_items';
const OLD_GOLD_STORAGE_KEY = 'cart_old_gold';
const SCHEME_STORAGE_KEY = 'cart_saving_scheme';

export interface CartSchemeState {
  schemeGuid: string;
  planName: string;
  customerGuid?: string | null;
  corpusAmount: number;
}

export interface CartOldGoldState {
  receiptGuid: string;
  grossWeight: number;
  testedPurityCode?: string | null;
  testedPurityPercent?: number | null;
  ratePerGram: number;
  deductionPercent: number;
  creditAmount: number;
  remarks?: string | null;
  customerGuid?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  readonly productList = signal<any[]>(this.readInitialCart());
  readonly oldGoldState = signal<CartOldGoldState | null>(this.readInitialOldGold());
  readonly schemeState = signal<CartSchemeState | null>(this.readInitialScheme());

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
    this.clearOldGold();
    this.clearScheme();
  }

  setScheme(state: CartSchemeState | null): void {
    this.schemeState.set(state);
    try {
      if (state) {
        localStorage.setItem(SCHEME_STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(SCHEME_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors.
    }
  }

  clearScheme(): void {
    this.setScheme(null);
  }

  private readInitialScheme(): CartSchemeState | null {
    let raw: string | null = null;
    try { raw = localStorage.getItem(SCHEME_STORAGE_KEY); } catch { return null; }
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed as CartSchemeState : null;
    } catch {
      try { localStorage.removeItem(SCHEME_STORAGE_KEY); } catch { /* ignore */ }
      return null;
    }
  }

  setOldGold(state: CartOldGoldState | null): void {
    this.oldGoldState.set(state);
    try {
      if (state) {
        localStorage.setItem(OLD_GOLD_STORAGE_KEY, JSON.stringify(state));
      } else {
        localStorage.removeItem(OLD_GOLD_STORAGE_KEY);
      }
    } catch {
      // Ignore.
    }
  }

  clearOldGold(): void {
    this.setOldGold(null);
  }

  private readInitialOldGold(): CartOldGoldState | null {
    let raw: string | null = null;
    try { raw = localStorage.getItem(OLD_GOLD_STORAGE_KEY); } catch { return null; }
    if (!raw) { return null; }
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed as CartOldGoldState : null;
    } catch {
      try { localStorage.removeItem(OLD_GOLD_STORAGE_KEY); } catch { /* ignore */ }
      return null;
    }
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
