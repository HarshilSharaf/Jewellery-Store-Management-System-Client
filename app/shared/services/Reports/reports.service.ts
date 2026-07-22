import { Injectable, inject, signal } from '@angular/core';
import { DbBridgeService } from '../Db/db-bridge.service';
import { DayBookRow } from '../../../interfaces/Reports/report-day-book';
import {
  SalesRegisterRow,
  SalesRegisterStatus,
} from '../../../interfaces/Reports/report-sales-register';
import {
  LowStockCategoryRow,
  StockSummaryByPurityRow,
} from '../../../interfaces/Reports/report-stock-summary';
import { Gstr1ExportPayload } from '../../../interfaces/Reports/report-gstr1';

/**
 * Renderer-side wrapper for K's report SPs. Prefers the dedicated
 * `window.electronAPI.reports` bridge if exposed, else falls through
 * DbBridge -- mirrors the Phase 1 pattern.
 */
@Injectable({ providedIn: 'root' })
export class ReportsService {

  private readonly db = inject(DbBridgeService);

  readonly dayBookRows = signal<DayBookRow[]>([]);
  readonly salesRegisterRows = signal<SalesRegisterRow[]>([]);
  readonly stockSummaryRows = signal<StockSummaryByPurityRow[]>([]);
  readonly gstr1Payload = signal<Gstr1ExportPayload>({ rows: [], hsnSummary: [] });
  readonly lowStockRows = signal<LowStockCategoryRow[]>([]);
  readonly loading = signal<boolean>(false);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.reports;
  }

  async dayBook(dateFrom: string, dateTo: string): Promise<DayBookRow[]> {
    this.loading.set(true);
    try {
      if (this.api?.dayBook) {
        const rows = this.normaliseRows<DayBookRow>(
          await this.api.dayBook({ dateFrom, dateTo })
        );
        this.dayBookRows.set(rows);
        return rows;
      }
      const rows = await this.db.execute('call get_day_book(?, ?);', [dateFrom, dateTo]);
      const list = Array.isArray(rows) ? (rows as DayBookRow[]) : [];
      this.dayBookRows.set(list);
      return list;
    } catch {
      this.dayBookRows.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async salesRegister(
    dateFrom: string,
    dateTo: string,
    customerGuid: string | null = null,
    statusFilter: SalesRegisterStatus | null = null,
  ): Promise<SalesRegisterRow[]> {
    this.loading.set(true);
    try {
      if (this.api?.salesRegister) {
        const rows = this.normaliseRows<SalesRegisterRow>(
          await this.api.salesRegister({ dateFrom, dateTo, customerGuid, statusFilter })
        );
        this.salesRegisterRows.set(rows);
        return rows;
      }
      const rows = await this.db.execute(
        'call get_sales_register(?, ?, ?, ?);',
        [dateFrom, dateTo, customerGuid, statusFilter],
      );
      const list = Array.isArray(rows) ? (rows as SalesRegisterRow[]) : [];
      this.salesRegisterRows.set(list);
      return list;
    } catch {
      this.salesRegisterRows.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async stockSummaryByPurity(asOfDate: string | null = null): Promise<StockSummaryByPurityRow[]> {
    this.loading.set(true);
    try {
      if (this.api?.stockSummaryByPurity) {
        const rows = this.normaliseRows<StockSummaryByPurityRow>(
          await this.api.stockSummaryByPurity({ asOfDate })
        );
        this.stockSummaryRows.set(rows);
        return rows;
      }
      const rows = await this.db.execute(
        'call get_stock_summary_by_purity(?);',
        [asOfDate],
      );
      const list = Array.isArray(rows) ? (rows as StockSummaryByPurityRow[]) : [];
      this.stockSummaryRows.set(list);
      return list;
    } catch {
      this.stockSummaryRows.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async gstr1Export(monthYear: string): Promise<Gstr1ExportPayload> {
    this.loading.set(true);
    try {
      if (this.api?.gstr1Export) {
        const payload = this.normalisePayload(await this.api.gstr1Export({ monthYear }));
        this.gstr1Payload.set(payload);
        return payload;
      }
      const raw = await this.db.execute(
        'call get_gstr1_export_rows(?);',
        [monthYear],
      );
      const payload = this.splitGstr1Rows(raw);
      this.gstr1Payload.set(payload);
      return payload;
    } catch {
      const empty: Gstr1ExportPayload = { rows: [], hsnSummary: [] };
      this.gstr1Payload.set(empty);
      return empty;
    } finally {
      this.loading.set(false);
    }
  }

  async lowStockByCategory(thresholdCount = 3): Promise<LowStockCategoryRow[]> {
    try {
      if (this.api?.lowStockByCategory) {
        const rows = this.normaliseRows<LowStockCategoryRow>(
          await this.api.lowStockByCategory({ thresholdCount })
        );
        this.lowStockRows.set(rows);
        return rows;
      }
      const rows = await this.db.execute(
        'call get_low_stock_by_category(?);',
        [thresholdCount],
      );
      const list = Array.isArray(rows) ? (rows as LowStockCategoryRow[]) : [];
      this.lowStockRows.set(list);
      return list;
    } catch {
      this.lowStockRows.set([]);
      return [];
    }
  }

  private normaliseRows<T>(raw: any): T[] {
    if (!raw) { return []; }
    if (Array.isArray(raw)) {
      const first = raw[0];
      if (Array.isArray(first)) { return first as T[]; }
      return raw as T[];
    }
    return [];
  }

  private normalisePayload(raw: any): Gstr1ExportPayload {
    if (raw && typeof raw === 'object' && Array.isArray((raw as any).rows)) {
      return {
        rows: (raw as any).rows,
        hsnSummary: Array.isArray((raw as any).hsnSummary) ? (raw as any).hsnSummary : [],
      };
    }
    return this.splitGstr1Rows(raw);
  }

  private splitGstr1Rows(raw: any): Gstr1ExportPayload {
    const arr = Array.isArray(raw) ? raw : [];
    const rows: any[] = [];
    const hsnSummary: any[] = [];
    for (const row of arr) {
      if (row && row.hsnCode !== undefined && row.taxableValue !== undefined
          && row.invoiceCount !== undefined && row.invoiceNumber === undefined) {
        hsnSummary.push(row);
      } else if (row) {
        rows.push(row);
      }
    }
    return { rows, hsnSummary };
  }
}
