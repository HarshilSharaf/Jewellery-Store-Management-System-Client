import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideRefreshCw,
  lucideDownload,
  lucideChartLine,
} from '@ng-icons/lucide';

import { ReportsService } from '../../../../shared/services/Reports/reports.service';
import { DayBookRow } from '../../../../interfaces/Reports/report-day-book';
import { exportToCSV } from '../../../../shared/utils/csv-export';
import { buildDayBookXml, downloadXml } from '../../../../shared/utils/tally-xml';

interface DayBookTotals {
  cash: number;
  cheque: number;
  upi: number;
  card: number;
  online: number;
  total: number;
  invoiceCount: number;
  totalTaxableValue: number;
}

@Component({
  selector: 'app-day-book',
  templateUrl: './day-book.component.html',
  styleUrls: ['./day-book.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowLeft, lucideRefreshCw, lucideDownload, lucideChartLine }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DayBookComponent implements OnInit {

  private readonly reports = inject(ReportsService);

  private readonly today = new Date().toISOString().slice(0, 10);

  readonly dateFrom = signal<string>(this.today);
  readonly dateTo = signal<string>(this.today);
  readonly rows = signal<DayBookRow[]>([]);
  readonly loading = signal<boolean>(false);

  readonly totals = computed<DayBookTotals>(() => {
    const list = this.rows();
    return list.reduce<DayBookTotals>((acc, r) => {
      acc.cash += Number(r.cash) || 0;
      acc.cheque += Number(r.cheque) || 0;
      acc.upi += Number(r.upi) || 0;
      acc.card += Number(r.card) || 0;
      acc.online += Number(r.online) || 0;
      acc.total += Number(r.total) || 0;
      acc.invoiceCount += Number(r.invoiceCount) || 0;
      acc.totalTaxableValue += Number(r.totalTaxableValue) || 0;
      return acc;
    }, { cash: 0, cheque: 0, upi: 0, card: 0, online: 0, total: 0, invoiceCount: 0, totalTaxableValue: 0 });
  });

  ngOnInit(): void { this.refresh(); }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const rows = await this.reports.dayBook(this.dateFrom(), this.dateTo());
      this.rows.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
  }

  exportCSV(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const flat = rows.map(r => ({
      Date: r.txDate,
      Cash: Number(r.cash) || 0,
      Cheque: Number(r.cheque) || 0,
      UPI: Number(r.upi) || 0,
      Card: Number(r.card) || 0,
      Online: Number(r.online) || 0,
      Total: Number(r.total) || 0,
      Invoices: Number(r.invoiceCount) || 0,
      TaxableValue: Number(r.totalTaxableValue) || 0,
    }));
    exportToCSV(flat, `day-book-${this.dateFrom()}-${this.dateTo()}.csv`);
  }

  exportTallyXml(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const xml = buildDayBookXml(rows);
    downloadXml(xml, `tally-daybook-${this.dateFrom()}-${this.dateTo()}.xml`);
  }

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
