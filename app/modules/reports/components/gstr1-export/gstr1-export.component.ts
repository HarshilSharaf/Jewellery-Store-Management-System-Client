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

  exportJSON(): void {
    const payload = this.payload();
    if (!payload.rows.length && !payload.hsnSummary.length) { return; }

    const b2b: any[] = [];
    const b2cs: any[] = [];
    for (const r of payload.rows) {
      if (r.invoiceType === 'B2B') {
        b2b.push({
          invoiceNumber: r.invoiceNumber,
          invoiceDate: r.invoiceDate,
          customerGstin: r.customerGstin ?? '',
          placeOfSupply: r.invoicePlaceOfSupply ?? r.placeOfSupply,
          hsnCode: r.hsnCode,
          taxableValue: r.taxableValue,
          cgstRate: r.cgstRate,
          sgstRate: r.sgstRate,
          igstRate: r.igstRate,
          cgstAmount: r.cgstAmount,
          sgstAmount: r.sgstAmount,
          igstAmount: r.igstAmount,
          invoiceValue: r.invoiceValue,
        });
      } else {
        b2cs.push({
          placeOfSupply: r.invoicePlaceOfSupply ?? r.placeOfSupply,
          hsnCode: r.hsnCode,
          taxableValue: r.taxableValue,
          cgstRate: r.cgstRate,
          sgstRate: r.sgstRate,
          igstRate: r.igstRate,
          cgstAmount: r.cgstAmount,
          sgstAmount: r.sgstAmount,
          igstAmount: r.igstAmount,
          invoiceValue: r.invoiceValue,
        });
      }
    }

    const shape = {
      gstin: null as string | null,
      fp: this.monthYear().replace('-', ''),
      b2b,
      b2cs,
      hsn: payload.hsnSummary.map(h => ({
        hsnCode: h.hsnCode,
        invoiceCount: h.invoiceCount,
        taxableValue: h.taxableValue,
        cgstAmount: h.cgstAmount,
        sgstAmount: h.sgstAmount,
        igstAmount: h.igstAmount,
        invoiceValue: h.invoiceValue,
      })),
    };

    exportToJSON(shape, `gstr1-${this.monthYear()}.json`);
  }

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
