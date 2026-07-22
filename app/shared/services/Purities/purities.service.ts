import { Injectable, signal } from '@angular/core';
import { Purity } from '../../../interfaces/Shared/purity';
import { TaxSlabRow } from '../../../interfaces/Shared/tax-slab';

/**
 * Convenience wrapper around `get_purities` / `get_tax_slabs`. These
 * SPs do not have dedicated IPC bridges (they read tiny lookup tables),
 * so we fall through to `window.electronAPI.db.execute`.
 */
@Injectable({ providedIn: 'root' })
export class PuritiesService {
  private readonly _purities = signal<Purity[]>([]);
  private readonly _taxSlabs = signal<TaxSlabRow[]>([]);

  readonly purities = this._purities.asReadonly();
  readonly taxSlabs = this._taxSlabs.asReadonly();

  private get db(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.db;
  }

  async getPurities(): Promise<Purity[]> {
    if (!this.db?.execute) { return []; }
    const rows = this.normalise(await this.db.execute('call get_purities();', []));
    this._purities.set(rows as Purity[]);
    return rows as Purity[];
  }

  async getTaxSlabs(): Promise<TaxSlabRow[]> {
    if (!this.db?.execute) { return []; }
    const rows = this.normalise(await this.db.execute('call get_tax_slabs();', []));
    this._taxSlabs.set(rows as TaxSlabRow[]);
    return rows as TaxSlabRow[];
  }

  /** HSN code -> slab, useful for feeding into computeCartTotals(). */
  taxSlabsByHsn(): Record<string, TaxSlabRow> {
    const map: Record<string, TaxSlabRow> = {};
    for (const s of this._taxSlabs()) { map[s.hsnCode] = s; }
    return map;
  }

  private normalise(result: any): any[] {
    if (!result) { return []; }
    if (Array.isArray(result)) {
      const first = result[0];
      if (Array.isArray(first)) { return first; }
      return result;
    }
    return [];
  }
}
