import { Injectable, signal, inject } from '@angular/core';
import { ShopSettings } from '../../../interfaces/Shared/shop-settings';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for A's shop-settings access. Prefers the dedicated
 * `window.electronAPI.shopSettings` bridge if the parent process exposes
 * it, else falls back to calling the stored procs through DbBridge. The
 * Phase 1 Electron main process only ships the generic db bridge today.
 */
@Injectable({ providedIn: 'root' })
export class ShopSettingsService {

  private readonly _settings = signal<ShopSettings | null>(null);
  private readonly _loaded = signal<boolean>(false);
  private readonly db = inject(DbBridgeService);

  readonly settings = this._settings.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.shopSettings;
  }

  async get(): Promise<ShopSettings | null> {
    try {
      if (this.api?.get) {
        const row = this.first(await this.api.get());
        this._settings.set(row);
        this._loaded.set(true);
        return row;
      }
      const rows = await this.db.execute('call get_shop_settings();', []);
      const row = (Array.isArray(rows) && rows.length) ? rows[0] as ShopSettings : null;
      this._settings.set(row);
      this._loaded.set(true);
      return row;
    } catch {
      this._loaded.set(true);
      return null;
    }
  }

  async save(payload: ShopSettings): Promise<ShopSettings | null> {
    try {
      if (this.api?.save) {
        const row = this.first(await this.api.save(payload));
        this._settings.set(row);
        this._loaded.set(true);
        return row;
      }
      await this.db.execute(
        'call save_shop_settings(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
        [
          payload.shopName,
          payload.gstin,
          payload.pan ?? null,
          payload.addressLine1,
          payload.addressLine2 ?? null,
          payload.city,
          payload.state,
          payload.stateCode,
          payload.pincode,
          payload.phone,
          payload.email ?? null,
          payload.logoPath ?? null,
          payload.invoicePrefix,
          payload.invoiceStartFrom,
          payload.defaultCurrency ?? 'INR',
          payload.timezone ?? 'Asia/Kolkata',
          payload.roundOffEnabled ? 1 : 0,
        ],
      );
      return await this.get();
    } catch {
      return this._settings();
    }
  }

  async resetInvoiceCounter(newValue: number): Promise<ShopSettings | null> {
    try {
      await this.db.execute('call reset_invoice_counter(?);', [newValue]);
      return await this.get();
    } catch {
      return this._settings();
    }
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
