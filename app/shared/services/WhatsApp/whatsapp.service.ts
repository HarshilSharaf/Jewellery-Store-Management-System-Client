import { Injectable, inject } from '@angular/core';
import {
  GetWhatsappLogArgs,
  SendWhatsappPayload,
  SendWhatsappResult,
  UpdateWhatsappStatusPayload,
  WhatsappSendLogRow,
} from '../../../interfaces/WhatsApp/whatsapp';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for P's WhatsApp send-log SPs plus the main-process
 * send-orchestrator on IPC channel `whatsapp:send`. The orchestrator reads
 * shopsettings.whatsappEnabled + API config, queues a send-log row, calls
 * Meta Cloud API, and flips the row to sent/failed. Callers should treat a
 * non-`ok` result as a friendly failure surface, not a thrown exception.
 */
@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly db = inject(DbBridgeService);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.whatsapp;
  }

  async send(payload: SendWhatsappPayload): Promise<SendWhatsappResult> {
    if (this.api?.send) {
      const res = await this.api.send(payload);
      // Main-process orchestrator returns the SendWhatsappResult shape.
      if (res && typeof res === 'object') { return res as SendWhatsappResult; }
      return { ok: false, error: 'invalid_response' };
    }
    // No IPC bridge: nothing sensible to do (main-process is where the Meta
    // credential lives), so surface a not_configured error and let the UI
    // banner deal with it.
    return { ok: false, error: 'not_configured' };
  }

  async updateStatus(payload: UpdateWhatsappStatusPayload): Promise<any[]> {
    if (this.api?.updateStatus) {
      return this.normalise(await this.api.updateStatus(payload));
    }
    return await this.db.execute(
      'call update_whatsapp_status(?, ?, ?, ?, ?);',
      [
        payload.sendGuid,
        payload.newStatus,
        payload.metaMessageId ?? null,
        payload.errorMessage ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async getLog(args: GetWhatsappLogArgs): Promise<any[]> {
    if (this.api?.getLog) {
      return this.normalise(await this.api.getLog(args));
    }
    return await this.db.execute(
      'call get_whatsapp_send_log(?, ?, ?, ?, ?, ?);',
      [
        args.customerGuid ?? null,
        args.status ?? null,
        args.dateFrom ?? null,
        args.dateTo ?? null,
        args.pageSize ?? 20,
        args.page ?? 1,
      ],
    );
  }

  async getByCustomer(customerGuid: string): Promise<WhatsappSendLogRow[]> {
    if (this.api?.getByCustomer) {
      return this.normalise(await this.api.getByCustomer(customerGuid)) as WhatsappSendLogRow[];
    }
    const rows = await this.db.execute(
      'call get_whatsapp_sends_by_customer(?);',
      [customerGuid],
    );
    return Array.isArray(rows) ? (rows as WhatsappSendLogRow[]) : [];
  }

  async getByInvoice(invoiceGuid: string): Promise<WhatsappSendLogRow[]> {
    if (this.api?.getByInvoice) {
      return this.normalise(await this.api.getByInvoice(invoiceGuid)) as WhatsappSendLogRow[];
    }
    const rows = await this.db.execute(
      'call get_whatsapp_sends_by_invoice(?);',
      [invoiceGuid],
    );
    return Array.isArray(rows) ? (rows as WhatsappSendLogRow[]) : [];
  }

  private normalise(result: any): any[] {
    if (!result) return [];
    if (Array.isArray(result)) {
      const first = result[0];
      if (Array.isArray(first)) {
        let out: any[] = [];
        for (const set of result) {
          if (Array.isArray(set)) out = out.concat(set);
        }
        return out;
      }
      return result;
    }
    return [];
  }
}
