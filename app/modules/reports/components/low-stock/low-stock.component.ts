import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowLeft, lucideRefreshCw, lucideDownload, lucidePackage } from '@ng-icons/lucide';

import { ReportsService } from '../../../../shared/services/Reports/reports.service';
import { LowStockCategoryRow } from '../../../../interfaces/Reports/report-stock-summary';
import { exportToCSV } from '../../../../shared/utils/csv-export';

/**
 * Low-stock-by-category report. Surfaces the get_low_stock_by_category proc:
 * category combinations (master/sub/product) whose in-stock unit count is below
 * a threshold, so the shop knows what to restock or get made.
 */
@Component({
  selector: 'app-low-stock',
  templateUrl: './low-stock.component.html',
  styleUrls: ['./low-stock.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowLeft, lucideRefreshCw, lucideDownload, lucidePackage }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LowStockComponent implements OnInit {

  private readonly reports = inject(ReportsService);

  readonly threshold = signal<number>(3);
  readonly rows = signal<LowStockCategoryRow[]>([]);
  readonly loading = signal<boolean>(false);

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const t = Math.max(1, Math.floor(Number(this.threshold()) || 3));
      this.rows.set(await this.reports.lowStockByCategory(t));
    } finally {
      this.loading.set(false);
    }
  }

  onThresholdChange(v: string): void {
    this.threshold.set(Math.max(1, Math.floor(Number(v) || 3)));
  }

  exportCSV(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const flat = rows.map((r) => ({
      Master: r.masterCategoryName,
      Sub: r.subCategoryName,
      Product: r.productCategoryName,
      InStock: Number(r.inStockCount) || 0,
      NetWeightG: Number(r.totalNetWeight) || 0,
    }));
    exportToCSV(flat, `low-stock-under-${this.threshold()}.csv`);
  }

  formatGrams(value: number | null | undefined): string {
    return Number(value ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  }

  trackRow = (_: number, r: LowStockCategoryRow) =>
    `${r.masterCategoryId}-${r.subCategoryId}-${r.productCategoryId}`;
}
