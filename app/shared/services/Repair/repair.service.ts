import { Injectable, inject, signal } from '@angular/core';
import {
  CreateRepairTicketPayload,
  GetAllRepairTicketsArgs,
  LinkRepairToKarigarPayload,
  RepairTicket,
  SettleRepairTicketPayload,
  UpdateRepairStatusPayload,
} from '../../../interfaces/Repair/repair';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for P's repair-ticket SPs. Prefers the dedicated
 * `window.electronAPI.repair` bridge if the parent process exposes it,
 * else falls through to the generic DB IPC. Both paths return the same
 * flattened rowset shape.
 */
@Injectable({ providedIn: 'root' })
export class RepairService {
  private readonly db = inject(DbBridgeService);

  private readonly _lastList = signal<RepairTicket[]>([]);
  readonly lastList = this._lastList.asReadonly();

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.repair;
  }

  async create(payload: CreateRepairTicketPayload): Promise<any[]> {
    if (this.api?.create) {
      return this.normalise(await this.api.create(payload));
    }
    return await this.db.execute(
      'call create_repair_ticket(?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        payload.customerGuid,
        payload.receivedByUserId ?? null,
        payload.itemDescription,
        payload.itemPhotoPath ?? null,
        payload.weight ?? null,
        payload.estimatedCharge ?? null,
        payload.estimatedReturnDate ?? null,
        payload.notes ?? null,
        payload.karigarGuid ?? null,
      ],
    );
  }

  async updateStatus(payload: UpdateRepairStatusPayload): Promise<any[]> {
    if (this.api?.updateStatus) {
      return this.normalise(await this.api.updateStatus(payload));
    }
    return await this.db.execute(
      'call update_repair_status(?, ?, ?, ?, ?, ?);',
      [
        payload.ticketGuid,
        payload.newStatus,
        payload.actorUserId ?? null,
        payload.actualCharge ?? null,
        payload.paymentMode ?? null,
        payload.paymentRef ?? null,
      ],
    );
  }

  async settle(payload: SettleRepairTicketPayload): Promise<any[]> {
    if (this.api?.settle) {
      return this.normalise(await this.api.settle(payload));
    }
    return await this.db.execute(
      'call settle_repair_ticket(?, ?, ?, ?, ?);',
      [
        payload.ticketGuid,
        payload.actualCharge,
        payload.paymentMode,
        payload.paymentRef ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async linkToKarigar(payload: LinkRepairToKarigarPayload): Promise<any[]> {
    if (this.api?.linkToKarigar) {
      return this.normalise(await this.api.linkToKarigar(payload));
    }
    return await this.db.execute(
      'call link_repair_to_karigar(?, ?, ?, ?);',
      [
        payload.ticketGuid,
        payload.karigarGuid,
        payload.karigarJobGuid ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async getDetails(ticketGuid: string): Promise<any[]> {
    if (this.api?.getDetails) {
      return this.normalise(await this.api.getDetails(ticketGuid));
    }
    return await this.db.execute('call get_repair_ticket_details(?);', [ticketGuid]);
  }

  async getAll(args: GetAllRepairTicketsArgs): Promise<any[]> {
    let rows: any[];
    if (this.api?.getAll) {
      rows = this.normalise(await this.api.getAll(args));
    } else {
      rows = await this.db.execute(
        'call get_all_repair_tickets(?, ?, ?, ?, ?, ?);',
        [
          args.status ?? null,
          args.customerSearch ?? null,
          args.dateFrom ?? null,
          args.dateTo ?? null,
          args.pageSize ?? 20,
          args.page ?? 1,
        ],
      );
    }
    const list: RepairTicket[] = rows.filter((r: any) => r?.ticketGuid) as RepairTicket[];
    this._lastList.set(list);
    return rows;
  }

  async getByCustomer(customerGuid: string): Promise<RepairTicket[]> {
    if (this.api?.getByCustomer) {
      return this.normalise(await this.api.getByCustomer(customerGuid)) as RepairTicket[];
    }
    const rows = await this.db.execute(
      'call get_repair_tickets_by_customer(?);',
      [customerGuid],
    );
    return Array.isArray(rows) ? (rows as RepairTicket[]) : [];
  }

  async delete(ticketGuid: string, actorUserId: number | null = null): Promise<any[]> {
    if (this.api?.delete) {
      return this.normalise(await this.api.delete({ ticketGuid, actorUserId }));
    }
    return await this.db.execute(
      'call delete_repair_ticket(?, ?);',
      [ticketGuid, actorUserId],
    );
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
