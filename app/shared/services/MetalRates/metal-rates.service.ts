import { Injectable, signal, computed } from '@angular/core';
import {
  MetalRateRow,
  SaveMetalRatesRequest,
} from '../../../interfaces/Shared/metal-rate';

/**
 * Renderer-side wrapper for A's metal-rate IPC bridge exposed by
 * `preload.js` on `window.electronAPI.metalRates`.
 *
 * Signal-based so components can bind to `rates()` / `ratesByPurity()`
 * without manual subscription plumbing.
 */
@Injectable({ providedIn: 'root' })
export class MetalRatesService {

  private readonly _rates = signal<MetalRateRow[]>([]);
  private readonly _loaded = signal<boolean>(false);

  readonly rates = this._rates.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  /**
   * Map keyed by purity code (e.g. "916" -> row). Handy for cart
   * rate-lock: cart snapshot on open is `MetalRatesService.buildSnapshot(rates())`.
   */
  readonly ratesByPurity = computed<Record<string, MetalRateRow>>(() => {
    const map: Record<string, MetalRateRow> = {};
    for (const r of this._rates()) { map[r.purityCode] = r; }
    return map;
  });

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.metalRates;
  }

  async getCurrent(): Promise<MetalRateRow[]> {
    if (!this.api?.getCurrent) {
      this._loaded.set(true);
      return [];
    }
    const result = await this.api.getCurrent();
    // mysql2 returns [rows, fields] for CALLs when going through pool.query.
    // The main-process handler already unwraps to the rows slice.
    const rows: MetalRateRow[] = this.normalise(result);
    this._rates.set(rows);
    this._loaded.set(true);
    return rows;
  }

  async save(request: SaveMetalRatesRequest): Promise<MetalRateRow[]> {
    if (!this.api?.save) { return []; }
    const result = await this.api.save(request);
    const rows: MetalRateRow[] = this.normalise(result);
    this._rates.set(rows);
    this._loaded.set(true);
    return rows;
  }

  /**
   * Build the JSON snapshot embedded in Invoices.rateSnapshot when a bill
   * is locked. Keys are purity codes ("916"), values are rate per gram.
   */
  buildSnapshot(rates: MetalRateRow[] = this._rates()): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const r of rates) { snapshot[r.purityCode] = Number(r.ratePerGram); }
    return snapshot;
  }

  private normalise(result: any): MetalRateRow[] {
    if (!result) { return []; }
    if (Array.isArray(result)) {
      // mysql2 CALL result: [ [rows], [okPacket] ]
      const first = result[0];
      if (Array.isArray(first)) { return first as MetalRateRow[]; }
      return result as MetalRateRow[];
    }
    return [];
  }
}
