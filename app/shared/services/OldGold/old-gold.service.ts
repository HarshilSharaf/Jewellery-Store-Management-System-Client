import { Injectable, inject } from '@angular/core';
import { DbBridgeService } from '../Db/db-bridge.service';
import {
  OldGoldReceipt,
  SaveOldGoldReceiptPayload,
} from '../../../interfaces/OldGold/old-gold';

/**
 * Renderer-side wrapper over K's `oldGold.*` IPC channels. Falls back to
 * calling the stored procedures through the generic db bridge if the
 * dedicated channel isn't wired (mirrors the P1 fallthrough pattern used
 * by MetalRatesService and ShopSettingsService).
 */
@Injectable({ providedIn: 'root' })
export class OldGoldService {

  private readonly db = inject(DbBridgeService);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.oldGold;
  }

  async saveReceipt(payload: SaveOldGoldReceiptPayload): Promise<OldGoldReceipt | null> {
    const rows = this.api?.saveReceipt
      ? this.normalise(await this.api.saveReceipt(payload))
      : await this.db.execute(
          'call save_old_gold_receipt(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
          [
            payload.customerGuid,
            payload.invoiceGuid ?? null,
            payload.grossWeight,
            payload.testedPurityPercent ?? null,
            payload.testedPurityCode ?? null,
            payload.deductionPercent,
            payload.ratePerGram,
            payload.creditAmount,
            payload.remarks ?? null,
            payload.actorUserId ?? null,
          ],
        );
    if (Array.isArray(rows) && rows.length) {
      return rows[0] as OldGoldReceipt;
    }
    return null;
  }

  async getReceiptsByCustomer(customerGuid: string): Promise<OldGoldReceipt[]> {
    try {
      const rows = this.api?.getReceiptsByCustomer
        ? this.normalise(await this.api.getReceiptsByCustomer(customerGuid))
        : await this.db.execute('call get_old_gold_receipts_by_customer(?);', [customerGuid]);
      return Array.isArray(rows) ? (rows as OldGoldReceipt[]) : [];
    } catch {
      return [];
    }
  }

  async getReceiptByInvoice(invoiceGuid: string): Promise<OldGoldReceipt | null> {
    try {
      const rows = this.api?.getReceiptByInvoice
        ? this.normalise(await this.api.getReceiptByInvoice(invoiceGuid))
        : await this.db.execute('call get_old_gold_receipt_by_invoice(?);', [invoiceGuid]);
      if (Array.isArray(rows) && rows.length) { return rows[0] as OldGoldReceipt; }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Deletes an unbilled old-gold receipt (see the delete_old_gold_receipt
   * proc — it refuses to delete a receipt already linked to an invoice).
   * Returns true when a row was actually removed.
   */
  async deleteReceipt(receiptGuid: string, actorUserId: number | null = null): Promise<boolean> {
    try {
      const rows = this.api?.deleteReceipt
        ? this.normalise(await this.api.deleteReceipt(receiptGuid, actorUserId))
        : await this.db.execute('call delete_old_gold_receipt(?, ?);', [receiptGuid, actorUserId]);
      const row = Array.isArray(rows) && rows.length ? rows[0] : null;
      return !!(row && (row.deleted === 1 || row.deleted === '1'));
    } catch {
      return false;
    }
  }

  private normalise(raw: any): any[] {
    if (!raw) { return []; }
    if (Array.isArray(raw)) {
      const first = raw[0];
      if (Array.isArray(first)) { return first; }
      return raw;
    }
    return [];
  }
}
