import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideRefreshCw,
  lucideDownload,
  lucideFileJson,
} from '@ng-icons/lucide';

import { ReportsService } from '../../../../shared/services/Reports/reports.service';
import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import {
  Gstr1ExportPayload,
  Gstr1ExportRow,
  Gstr1HsnSummaryRow,
} from '../../../../interfaces/Reports/report-gstr1';
import { exportToJSON } from '../../../../shared/utils/csv-export';

@Component({
  selector: 'app-gstr1-export',
  templateUrl: './gstr1-export.component.html',
  styleUrls: ['./gstr1-export.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowLeft, lucideRefreshCw, lucideDownload, lucideFileJson }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Gstr1ExportComponent implements OnInit {

  private readonly reports = inject(ReportsService);
  private readonly shopSettings = inject(ShopSettingsService);

  readonly monthYear = signal<string>(this.previousMonth());
  readonly payload = signal<Gstr1ExportPayload>({ rows: [], hsnSummary: [] });
  readonly loading = signal<boolean>(false);

  readonly rows = computed<Gstr1ExportRow[]>(() => this.payload().rows);
  readonly hsnSummary = computed<Gstr1HsnSummaryRow[]>(() => this.payload().hsnSummary);

  ngOnInit(): void { this.refresh(); }

  private previousMonth(): string {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const p = await this.reports.gstr1Export(this.monthYear());
      this.payload.set(p);
    } finally {
      this.loading.set(false);
    }
  }

  onMonthChange(v: string): void { this.monthYear.set(v); }

  async exportJSON(): Promise<void> {
    const payload = this.payload();
    if (!payload.rows.length && !payload.hsnSummary.length) { return; }

    const gstin = await this.resolveShopGstin();
    const shape = this.buildGstnPayload(payload, gstin);
    exportToJSON(shape, `gstr1-${this.monthYear()}.json`);
  }

  /** Shop GSTIN for the return header (cached signal, else a fresh fetch). */
  private async resolveShopGstin(): Promise<string> {
    let row: any = this.shopSettings.settings();
    if (!row) {
      try { row = await this.shopSettings.get(); } catch { row = null; }
    }
    const shop = Array.isArray(row) ? row[0] : row;
    return (shop?.gstin ?? '').toString();
  }

  /**
   * Transforms the flat per-invoice rows + HSN summary into the GSTN GSTR-1
   * offline-utility JSON shape (nested b2b, aggregated b2cs, hsn.data) so a CA
   * can upload it. The proc emits one row per invoice with a single effective
   * rate + HSN, so each B2B invoice maps to one inv with one itm.
   */
  private buildGstnPayload(payload: Gstr1ExportPayload, gstin: string): Record<string, any> {
    const round2 = (n: number | null | undefined) => Math.round((Number(n) || 0) * 100) / 100;
    const posOf = (r: Gstr1ExportRow): string => {
      const raw = String(r.placeOfSupply ?? r.invoicePlaceOfSupply ?? '');
      const m = raw.match(/\d{1,2}/);
      return m ? m[0].padStart(2, '0') : '';
    };
    const idtOf = (d: string): string => {
      const [y, mo, da] = String(d).slice(0, 10).split('-');
      return (da && mo && y) ? `${da}-${mo}-${y}` : String(d);
    };
    const rateOf = (r: Gstr1ExportRow) =>
      round2((Number(r.cgstRate) || 0) + (Number(r.sgstRate) || 0) + (Number(r.igstRate) || 0));

    const b2bByCtin = new Map<string, any>();
    const b2csByKey = new Map<string, any>();

    for (const r of payload.rows) {
      const isInter = (Number(r.igstAmount) || 0) > 0;
      if (r.invoiceType === 'B2B' && r.customerGstin) {
        const ctin = r.customerGstin;
        if (!b2bByCtin.has(ctin)) { b2bByCtin.set(ctin, { ctin, inv: [] }); }
        b2bByCtin.get(ctin).inv.push({
          inum: r.invoiceNumber,
          idt: idtOf(r.invoiceDate),
          val: round2(r.invoiceValue),
          pos: posOf(r),
          rchrg: 'N',
          inv_typ: 'R',
          itms: [{
            num: 1,
            itm_det: {
              txval: round2(r.taxableValue),
              rt: rateOf(r),
              camt: round2(r.cgstAmount),
              samt: round2(r.sgstAmount),
              iamt: round2(r.igstAmount),
              csamt: 0,
            },
          }],
        });
      } else {
        const pos = posOf(r);
        const rt = rateOf(r);
        const sply = isInter ? 'INTER' : 'INTRA';
        const key = `${sply}|${pos}|${rt}`;
        if (!b2csByKey.has(key)) {
          b2csByKey.set(key, { sply_ty: sply, typ: 'OE', pos, rt, txval: 0, camt: 0, samt: 0, iamt: 0, csamt: 0 });
        }
        const e = b2csByKey.get(key);
        e.txval = round2(e.txval + Number(r.taxableValue || 0));
        e.camt = round2(e.camt + Number(r.cgstAmount || 0));
        e.samt = round2(e.samt + Number(r.sgstAmount || 0));
        e.iamt = round2(e.iamt + Number(r.igstAmount || 0));
      }
    }

    const hsnData = payload.hsnSummary.map((h, i) => {
      const txval = Number(h.taxableValue) || 0;
      const totalTax = (Number(h.cgstAmount) || 0) + (Number(h.sgstAmount) || 0) + (Number(h.igstAmount) || 0);
      return {
        num: i + 1,
        hsn_sc: h.hsnCode,
        desc: h.hsnCode === '7113' ? 'Articles of jewellery of precious metal' : '',
        uqc: 'GMS',
        qty: 0,
        txval: round2(h.taxableValue),
        rt: txval > 0 ? round2((totalTax / txval) * 100) : 0,
        iamt: round2(h.igstAmount),
        camt: round2(h.cgstAmount),
        samt: round2(h.sgstAmount),
        csamt: 0,
      };
    });

    const [yy, mm] = this.monthYear().split('-');
    return {
      gstin,
      fp: `${mm}${yy}`, // GSTN filing period is MMYYYY
      version: 'GST3.2.1',
      hash: 'hash',
      b2b: Array.from(b2bByCtin.values()),
      b2cs: Array.from(b2csByKey.values()),
      hsn: { data: hsnData },
    };
  }

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
