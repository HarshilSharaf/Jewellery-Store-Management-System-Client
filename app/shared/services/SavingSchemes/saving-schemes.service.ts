import { Injectable, inject, signal } from '@angular/core';
import {
  EnrollSavingSchemePayload,
  ForfeitSavingSchemePayload,
  RecordSchemeInstallmentPayload,
  RedeemSavingSchemePayload,
  SavingScheme,
} from '../../../interfaces/SavingSchemes/saving-scheme';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for K's saving-scheme SPs. Prefers the dedicated
 * `window.electronAPI.savingSchemes` bridge if the parent process exposes
 * it; otherwise falls through to the generic DB IPC. Both paths return the
 * same flattened rowset shape (K's handoff confirms both are wired).
 */
@Injectable({ providedIn: 'root' })
export class SavingSchemesService {
  private readonly db = inject(DbBridgeService);

  private readonly _lastList = signal<SavingScheme[]>([]);
  readonly lastList = this._lastList.asReadonly();

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.savingSchemes;
  }

  async enroll(payload: EnrollSavingSchemePayload): Promise<any[]> {
    if (this.api?.enroll) {
      return this.normalise(await this.api.enroll(payload));
    }
    return await this.db.execute(
      'call enroll_saving_scheme(?, ?, ?, ?, ?, ?);',
      [
        payload.customerGuid,
        payload.planName,
        payload.monthlyAmount,
        payload.tenureMonths ?? 11,
        payload.bonusInstallments ?? 1,
        payload.actorUserId ?? null,
      ],
    );
  }

  async recordInstallment(payload: RecordSchemeInstallmentPayload): Promise<any[]> {
    if (this.api?.recordInstallment) {
      return this.normalise(await this.api.recordInstallment(payload));
    }
    return await this.db.execute(
      'call record_scheme_installment(?, ?, ?, ?, ?, ?, ?);',
      [
        payload.schemeGuid,
        payload.amount,
        payload.paymentMode,
        payload.refNumber ?? null,
        payload.receiptDate ?? null,
        payload.actorUserId ?? null,
        payload.allowMultipleThisMonth ? 1 : 0,
      ],
    );
  }

  async redeem(payload: RedeemSavingSchemePayload): Promise<any[]> {
    if (this.api?.redeem) {
      return this.normalise(await this.api.redeem(payload));
    }
    return await this.db.execute(
      'call redeem_saving_scheme(?, ?, ?);',
      [payload.schemeGuid, payload.invoiceGuid, payload.actorUserId ?? null],
    );
  }

  async forfeit(payload: ForfeitSavingSchemePayload): Promise<any[]> {
    if (this.api?.forfeit) {
      return this.normalise(await this.api.forfeit(payload));
    }
    return await this.db.execute(
      'call forfeit_saving_scheme(?, ?, ?);',
      [payload.schemeGuid, payload.reason, payload.actorUserId ?? null],
    );
  }

  async getDetails(schemeGuid: string): Promise<any[]> {
    if (this.api?.getDetails) {
      return this.normalise(await this.api.getDetails(schemeGuid));
    }
    // The details SP returns TWO result sets; DbBridge.flatten() will
    // concat them, so downstream needs to split by shape.
    return await this.db.execute('call get_saving_scheme_details(?);', [schemeGuid]);
  }

  async getAll(itemsPerPage: number, pageNumber: number,
               statusFilter: string | null = null,
               searchQuery = ''): Promise<any[]> {
    let rows: any[];
    if (this.api?.getAll) {
      rows = this.normalise(await this.api.getAll(itemsPerPage, pageNumber, statusFilter, searchQuery));
    } else {
      rows = await this.db.execute(
        'call get_all_saving_schemes(?, ?, ?, ?);',
        [itemsPerPage, pageNumber, statusFilter, searchQuery],
      );
    }
    // The list SP returns two sets: rows + [{ totalRecords }].
    const list: SavingScheme[] = rows.filter((r) => r && r.schemeGuid) as SavingScheme[];
    this._lastList.set(list);
    return rows;
  }

  async getByCustomer(customerGuid: string): Promise<SavingScheme[]> {
    if (this.api?.getByCustomer) {
      return this.normalise(await this.api.getByCustomer(customerGuid)) as SavingScheme[];
    }
    const rows = await this.db.execute('call get_saving_schemes_by_customer(?);', [customerGuid]);
    return Array.isArray(rows) ? (rows as SavingScheme[]) : [];
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
