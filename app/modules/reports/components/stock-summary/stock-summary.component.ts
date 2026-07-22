import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideRefreshCw,
  lucideDownload,
  lucidePackage,
} from '@ng-icons/lucide';

import { ReportsService } from '../../../../shared/services/Reports/reports.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { StockSummaryByPurityRow } from '../../../../interfaces/Reports/report-stock-summary';
import { exportToCSV } from '../../../../shared/utils/csv-export';

interface StockTotals {
  unitCount: number;
  netWeightGrams: number;
  grossWeightGrams: number;
  totalTagPrice: number;
  totalCostPrice: number;
}

@Component({
  selector: 'app-stock-summary',
  templateUrl: './stock-summary.component.html',
  styleUrls: ['./stock-summary.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowLeft, lucideRefreshCw, lucideDownload, lucidePackage }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StockSummaryComponent implements OnInit {

  private readonly reports = inject(ReportsService);
  readonly permissions = inject(PermissionsService);

  private readonly today = new Date().toISOString().slice(0, 10);
  readonly asOfDate = signal<string>(this.today);
  readonly rows = signal<StockSummaryByPurityRow[]>([]);
  readonly loading = signal<boolean>(false);

  readonly totals = computed<StockTotals>(() => {
    return this.rows().reduce<StockTotals>((acc, r) => {
      acc.unitCount += Number(r.unitCount) || 0;
      acc.netWeightGrams += Number(r.netWeightGrams) || 0;
      acc.grossWeightGrams += Number(r.grossWeightGrams) || 0;
      acc.totalTagPrice += Number(r.totalTagPrice) || 0;
      acc.totalCostPrice += Number(r.totalCostPrice) || 0;
      return acc;
    }, { unitCount: 0, netWeightGrams: 0, grossWeightGrams: 0, totalTagPrice: 0, totalCostPrice: 0 });
  });

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const rows = await this.reports.stockSummaryByPurity(this.asOfDate());
      this.rows.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  onAsOfChange(v: string): void { this.asOfDate.set(v); }

  purityChipClass(metalType: string, purityLabel: string, purityCode: string): string {
    const key = `${metalType} ${purityLabel} ${purityCode}`.toLowerCase();
    if (key.includes('platinum') || metalType === 'platinum') { return 'purity-chip--platinum'; }
    if (key.includes('silver')   || metalType === 'silver')   { return 'purity-chip--silver'; }
    return 'purity-chip--gold';
  }

  exportCSV(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const canSeeCost = this.permissions.costsVisible();
    const flat = rows.map(r => {
      const base: Record<string, any> = {
        Purity: r.purityLabel,
        Code: r.purityCode,
        Metal: r.metalType,
        Units: Number(r.unitCount) || 0,
        GrossWeightG: Number(r.grossWeightGrams) || 0,
        NetWeightG: Number(r.netWeightGrams) || 0,
        TagValuation: Number(r.totalTagPrice) || 0,
      };
      if (canSeeCost) { base['CostValuation'] = Number(r.totalCostPrice) || 0; }
      return base;
    });
    exportToCSV(flat, `stock-summary-${this.asOfDate()}.csv`);
  }

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatGrams(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }
}
