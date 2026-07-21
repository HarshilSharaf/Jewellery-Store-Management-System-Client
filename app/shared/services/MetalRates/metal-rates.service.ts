import { Injectable, signal, computed, inject } from '@angular/core';
import {
  MetalRateRow,
  SaveMetalRatesRequest,
} from '../../../interfaces/Shared/metal-rate';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for A's metal-rate access. Prefers the dedicated
 * `window.electronAPI.metalRates` bridge if the parent process exposes it,
 * else falls back to calling the stored procs through DbBridge. The Phase 1
 * Electron main process ships with only the generic db bridge, so the
 * DbBridge path is what actually runs today.
 */
@Injectable({ providedIn: 'root' })
export class MetalRatesService {

  private readonly _rates = signal<MetalRateRow[]>([]);
  private readonly _loaded = signal<boolean>(false);
  private readonly db = inject(DbBridgeService);

  readonly rates = this._rates.asReadonly();
  readonly loaded = this._loaded.asReadonly();

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
    try {
      if (this.api?.getCurrent) {
        const rows: MetalRateRow[] = this.normalise(await this.api.getCurrent());
        this._rates.set(rows);
        this._loaded.set(true);
        return rows;
      }
      const rows = await this.db.execute('call get_current_metal_rates();', []);
      const list = Array.isArray(rows) ? rows as MetalRateRow[] : [];
      this._rates.set(list);
      this._loaded.set(true);
      return list;
    } catch {
      this._loaded.set(true);
      return [];
    }
  }

  async getHistory(days = 30): Promise<MetalRateRow[]> {
    try {
      const rows = await this.db.execute('call get_metal_rates_history(?);', [days]);
      return Array.isArray(rows) ? rows as MetalRateRow[] : [];
    } catch {
      return [];
    }
  }

  async save(request: SaveMetalRatesRequest): Promise<MetalRateRow[]> {
    if (this.api?.save) {
      const rows: MetalRateRow[] = this.normalise(await this.api.save(request));
      this._rates.set(rows);
      this._loaded.set(true);
      return rows;
    }
    await this.db.execute('call save_metal_rates(?, ?, ?, ?, ?);', [
      request.effectiveDate,
      request.session,
      request.source ?? 'manual',
      request.setByUserId ?? null,
      JSON.stringify(request.rates),
    ]);
    return await this.getCurrent();
  }

  buildSnapshot(rates: MetalRateRow[] = this._rates()): Record<string, number> {
    const snapshot: Record<string, number> = {};
    for (const r of rates) { snapshot[r.purityCode] = Number(r.ratePerGram); }
    return snapshot;
  }

  private normalise(result: any): MetalRateRow[] {
    if (!result) { return []; }
    if (Array.isArray(result)) {
      const first = result[0];
      if (Array.isArray(first)) { return first as MetalRateRow[]; }
      return result as MetalRateRow[];
    }
    return [];
  }
}
