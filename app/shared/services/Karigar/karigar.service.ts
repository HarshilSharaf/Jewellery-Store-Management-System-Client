import { Injectable, inject } from '@angular/core';
import {
  AddKarigarPayload,
  IssueKarigarJobPayload,
  Karigar,
  KarigarJob,
  ReceiveKarigarJobPayload,
  SettleKarigarJobPayload,
  UpdateKarigarPayload,
} from '../../../interfaces/Karigar/karigar';
import { DbBridgeService } from '../Db/db-bridge.service';

/**
 * Renderer-side wrapper for K's karigar (goldsmith) SPs. Prefers the
 * dedicated `window.electronAPI.karigar` bridge if the parent process
 * exposes it; otherwise falls through to the generic DB IPC.
 */
@Injectable({ providedIn: 'root' })
export class KarigarService {
  private readonly db = inject(DbBridgeService);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.karigar;
  }

  async addKarigar(payload: AddKarigarPayload): Promise<any[]> {
    if (this.api?.addKarigar) {
      return this.normalise(await this.api.addKarigar(payload));
    }
    return await this.db.execute('call add_karigar(?, ?, ?, ?, ?);', [
      payload.name,
      payload.phone ?? null,
      payload.address ?? null,
      payload.remarks ?? null,
      payload.actorUserId ?? null,
    ]);
  }

  async getAllKarigars(itemsPerPage: number, pageNumber: number,
                      searchQuery = ''): Promise<any[]> {
    if (this.api?.getAllKarigars) {
      return this.normalise(await this.api.getAllKarigars(itemsPerPage, pageNumber, searchQuery));
    }
    return await this.db.execute('call get_all_karigars(?, ?, ?);', [
      itemsPerPage,
      pageNumber,
      searchQuery,
    ]);
  }

  async updateKarigar(payload: UpdateKarigarPayload): Promise<any[]> {
    if (this.api?.updateKarigar) {
      return this.normalise(await this.api.updateKarigar(payload));
    }
    return await this.db.execute('call update_karigar(?, ?, ?, ?, ?, ?);', [
      payload.karigarGuid,
      payload.name,
      payload.phone ?? null,
      payload.address ?? null,
      payload.remarks ?? null,
      payload.actorUserId ?? null,
    ]);
  }

  async deleteKarigar(karigarGuid: string, actorUserId: number | null = null): Promise<any[]> {
    if (this.api?.deleteKarigar) {
      return this.normalise(await this.api.deleteKarigar(karigarGuid, actorUserId));
    }
    return await this.db.execute('call delete_karigar(?, ?);', [karigarGuid, actorUserId]);
  }

  async issueJob(payload: IssueKarigarJobPayload): Promise<any[]> {
    if (this.api?.issueJob) {
      return this.normalise(await this.api.issueJob(payload));
    }
    return await this.db.execute(
      'call issue_karigar_job(?, ?, ?, ?, ?, ?, ?, ?);',
      [
        payload.karigarGuid,
        payload.issueDate ?? null,
        payload.issuedGrossWeight,
        payload.issuedPurityCode ?? null,
        payload.issuedStones && payload.issuedStones.length ? JSON.stringify(payload.issuedStones) : null,
        payload.expectedReturnDate ?? null,
        payload.description ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async receiveJob(payload: ReceiveKarigarJobPayload): Promise<any[]> {
    if (this.api?.receiveJob) {
      return this.normalise(await this.api.receiveJob(payload));
    }
    return await this.db.execute(
      'call receive_karigar_job(?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
      [
        payload.jobGuid,
        payload.receivedDate ?? null,
        payload.receivedGrossWeight,
        payload.receivedNetWeight,
        payload.receivedStoneWeight ?? 0,
        payload.wastagePercentAllowed ?? 0,
        payload.wastageGramsActual ?? 0,
        payload.makingCharge ?? 0,
        payload.remarks ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async settleJob(payload: SettleKarigarJobPayload): Promise<any[]> {
    if (this.api?.settleJob) {
      return this.normalise(await this.api.settleJob(payload));
    }
    return await this.db.execute(
      'call settle_karigar_job(?, ?, ?, ?, ?);',
      [
        payload.jobGuid,
        payload.settlementAmount,
        payload.paymentMode,
        payload.refNumber ?? null,
        payload.actorUserId ?? null,
      ],
    );
  }

  async getJobDetails(jobGuid: string): Promise<any[]> {
    if (this.api?.getJobDetails) {
      return this.normalise(await this.api.getJobDetails(jobGuid));
    }
    return await this.db.execute('call get_karigar_job_card_details(?);', [jobGuid]);
  }

  async getAllJobs(itemsPerPage: number, pageNumber: number,
                  karigarGuid: string | null = null,
                  statusFilter: string | null = null): Promise<any[]> {
    if (this.api?.getAllJobs) {
      return this.normalise(await this.api.getAllJobs(itemsPerPage, pageNumber, karigarGuid, statusFilter));
    }
    return await this.db.execute(
      'call get_all_karigar_jobs(?, ?, ?, ?);',
      [itemsPerPage, pageNumber, karigarGuid, statusFilter],
    );
  }

  async getLedger(karigarGuid: string, dateFrom: string | null = null,
                 dateTo: string | null = null): Promise<any[]> {
    if (this.api?.getLedger) {
      return this.normalise(await this.api.getLedger(karigarGuid, dateFrom, dateTo));
    }
    return await this.db.execute('call get_karigar_ledger(?, ?, ?);',
      [karigarGuid, dateFrom, dateTo]);
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
