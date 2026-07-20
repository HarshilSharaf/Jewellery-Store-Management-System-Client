import { Injectable, signal } from '@angular/core';
import { ShopSettings } from '../../../interfaces/Shared/shop-settings';

/**
 * Renderer-side wrapper for A's shop-settings IPC bridge exposed by
 * `preload.js` on `window.electronAPI.shopSettings`.
 */
@Injectable({ providedIn: 'root' })
export class ShopSettingsService {

  private readonly _settings = signal<ShopSettings | null>(null);
  private readonly _loaded = signal<boolean>(false);

  readonly settings = this._settings.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.shopSettings;
  }

  async get(): Promise<ShopSettings | null> {
    if (!this.api?.get) { this._loaded.set(true); return null; }
    const result = await this.api.get();
    const row = this.first(result);
    this._settings.set(row);
    this._loaded.set(true);
    return row;
  }

  async save(payload: ShopSettings): Promise<ShopSettings | null> {
    if (!this.api?.save) { return null; }
    const result = await this.api.save(payload);
    const row = this.first(result);
    this._settings.set(row);
    this._loaded.set(true);
    return row;
  }

  private first(result: any): ShopSettings | null {
    if (!result) { return null; }
    if (Array.isArray(result)) {
      const first = result[0];
      if (Array.isArray(first)) { return (first[0] as ShopSettings) ?? null; }
      return (first as ShopSettings) ?? null;
    }
    return null;
  }
}
