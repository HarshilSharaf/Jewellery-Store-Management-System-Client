import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideRefreshCw,
  lucideDownload,
  lucideReceiptText,
} from '@ng-icons/lucide';

import { ReportsService } from '../../../../shared/services/Reports/reports.service';
import {
  SalesRegisterRow,
  SalesRegisterStatus,
} from '../../../../interfaces/Reports/report-sales-register';
import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { exportToCSV } from '../../../../shared/utils/csv-export';
import { buildSalesRegisterXml, downloadXml } from '../../../../shared/utils/tally-xml';

interface CustomerOption {
  customerGuid: string;
  displayName: string;
}

interface SalesTotals {
  subTotalTaxable: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  oldGoldCredit: number;
  grandTotal: number;
}

@Component({
  selector: 'app-sales-register',
  templateUrl: './sales-register.component.html',
  styleUrls: ['./sales-register.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({ lucideArrowLeft, lucideRefreshCw, lucideDownload, lucideReceiptText }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalesRegisterComponent implements OnInit {

  private readonly reports = inject(ReportsService);
  private readonly customersSvc = inject(CustomerDataService);

  private readonly today = new Date().toISOString().slice(0, 10);
  private readonly monthAgo = this.dateNDaysAgo(30);

  readonly dateFrom = signal<string>(this.monthAgo);
  readonly dateTo = signal<string>(this.today);
  readonly statusFilter = signal<SalesRegisterStatus | 'all'>('all');
  readonly customerGuid = signal<string | null>(null);
  readonly customerSearch = signal<string>('');
  readonly customerOptions = signal<CustomerOption[]>([]);
  readonly showCustomerList = signal<boolean>(false);

  readonly rows = signal<SalesRegisterRow[]>([]);
  readonly loading = signal<boolean>(false);

  readonly totals = computed<SalesTotals>(() => {
    return this.rows().reduce<SalesTotals>((acc, r) => {
      acc.subTotalTaxable += Number(r.subTotalTaxable) || 0;
      acc.cgstAmount += Number(r.cgstAmount) || 0;
      acc.sgstAmount += Number(r.sgstAmount) || 0;
      acc.igstAmount += Number(r.igstAmount) || 0;
      acc.oldGoldCredit += Number(r.oldGoldCredit) || 0;
      acc.grandTotal += Number(r.grandTotal) || 0;
      return acc;
    }, { subTotalTaxable: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, oldGoldCredit: 0, grandTotal: 0 });
  });

  readonly statusOptions: Array<{ id: SalesRegisterStatus | 'all'; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'paid', label: 'Paid' },
    { id: 'pending', label: 'Pending' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  ngOnInit(): void {
    this.refresh();
  }

  private dateNDaysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }

  async refresh(): Promise<void> {
    this.loading.set(true);
    try {
      const status = this.statusFilter();
      const rows = await this.reports.salesRegister(
        this.dateFrom(),
        this.dateTo(),
        this.customerGuid(),
        status === 'all' ? null : status,
      );
      this.rows.set(rows);
    } finally {
      this.loading.set(false);
    }
  }

  onDateFromChange(v: string): void { this.dateFrom.set(v); }
  onDateToChange(v: string): void { this.dateTo.set(v); }

  setStatus(status: SalesRegisterStatus | 'all'): void {
    this.statusFilter.set(status);
    this.refresh();
  }

  async onCustomerSearchInput(value: string): Promise<void> {
    this.customerSearch.set(value);
    this.showCustomerList.set(true);
    if (!value || value.trim().length < 2) {
      this.customerOptions.set([]);
      return;
    }
    try {
      const rows: any[] = await this.customersSvc.getAllCustomers(false, 20, 1, value.trim(), false);
      const opts: CustomerOption[] = (Array.isArray(rows) ? rows : [])
        .map(r => ({
          customerGuid: r.customerGuid,
          displayName: this.customerDisplay(r),
        }))
        .filter(o => o.customerGuid);
      this.customerOptions.set(opts);
    } catch {
      this.customerOptions.set([]);
    }
  }

  selectCustomer(option: CustomerOption | null): void {
    this.customerGuid.set(option?.customerGuid ?? null);
    this.customerSearch.set(option?.displayName ?? '');
    this.showCustomerList.set(false);
    this.refresh();
  }

  clearCustomer(): void {
    this.customerGuid.set(null);
    this.customerSearch.set('');
    this.customerOptions.set([]);
    this.showCustomerList.set(false);
    this.refresh();
  }

  private customerDisplay(row: any): string {
    if (!row) { return ''; }
    const parts = [row.firstName, row.lastName].filter(Boolean);
    const label = parts.join(' ').trim() || row.userName || row.mobileNumber || row.email || 'Customer';
    if (row.mobileNumber) { return `${label} • ${row.mobileNumber}`; }
    return label;
  }

  exportCSV(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const flat = rows.map(r => ({
      Invoice: r.invoiceNumber,
      Date: r.invoiceDate,
      Customer: r.customerName,
      GSTIN: r.customerGstin ?? '',
      PlaceOfSupply: r.placeOfSupply ?? '',
      Taxable: Number(r.subTotalTaxable) || 0,
      CGST: Number(r.cgstAmount) || 0,
      SGST: Number(r.sgstAmount) || 0,
      IGST: Number(r.igstAmount) || 0,
      OldGoldCredit: Number(r.oldGoldCredit) || 0,
      GrandTotal: Number(r.grandTotal) || 0,
      Status: r.status,
      Type: r.invoiceType,
    }));
    exportToCSV(flat, `sales-register-${this.dateFrom()}-${this.dateTo()}.csv`);
  }

  exportTallyXml(): void {
    const rows = this.rows();
    if (!rows.length) { return; }
    const xml = buildSalesRegisterXml(rows);
    downloadXml(xml, `tally-sales-${this.dateFrom()}-${this.dateTo()}.xml`);
  }

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  statusClass(status: SalesRegisterStatus): string {
    return `status-chip status-chip--${status}`;
  }
}
