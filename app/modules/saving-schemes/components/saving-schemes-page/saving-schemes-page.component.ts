import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucidePiggyBank,
  lucideLoader,
  lucideCircleCheck,
  lucideCircleX,
  lucideCircleAlert,
} from '@ng-icons/lucide';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { SavingSchemesService } from '../../../../shared/services/SavingSchemes/saving-schemes.service';
import { EnrollSchemeFormComponent } from '../enroll-scheme-form/enroll-scheme-form.component';
import { SimplePaginatorComponent, SimplePageEvent } from '../../../../shared/components/simple-paginator/simple-paginator.component';
import { SavingScheme, SavingSchemeStatus } from '../../../../interfaces/SavingSchemes/saving-scheme';

const STATUS_OPTIONS: { value: SavingSchemeStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'matured', label: 'Matured' },
  { value: 'redeemed', label: 'Redeemed' },
  { value: 'forfeited', label: 'Forfeited' },
];

@Component({
  selector: 'app-saving-schemes-page',
  templateUrl: './saving-schemes-page.component.html',
  styleUrls: ['./saving-schemes-page.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, EnrollSchemeFormComponent, SimplePaginatorComponent],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucidePiggyBank,
      lucideLoader,
      lucideCircleCheck,
      lucideCircleX,
      lucideCircleAlert,
    }),
  ],
})
export class SavingSchemesPageComponent implements OnInit {

  readonly rows = signal<SavingScheme[]>([]);
  readonly totalRecords = signal(0);
  readonly isLoading = signal(false);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(15);
  readonly searchQuery = signal('');

  readonly statusFilters = signal<SavingSchemeStatus[]>([]);
  readonly showEnroll = signal(false);

  readonly statusOptions = STATUS_OPTIONS;

  private searchDebounce: any = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly schemesService = inject(SavingSchemesService);
  private readonly loggerService = inject(LoggerService);
  private readonly loaderService = inject(NgxUiLoaderService);

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });

  ngOnInit(): void {
    this.load();
  }

  async load(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.loaderService.start();

      const filter = this.statusFilters().length === 1 ? this.statusFilters()[0] : null;
      const result: any = await this.schemesService.getAll(
        this.pageSize(),
        this.pageIndex() + 1,
        filter,
        this.searchQuery().trim(),
      );

      const rows = Array.isArray(result) ? result : [];
      const total = rows.find((r: any) => typeof r?.totalRecords === 'number')?.totalRecords ?? 0;
      let schemes: SavingScheme[] = rows.filter((r: any) => r && r.schemeGuid) as SavingScheme[];

      // Client-side filter for multi-select status (SP only supports one).
      if (this.statusFilters().length > 1) {
        const set = new Set(this.statusFilters());
        schemes = schemes.filter((s) => set.has(s.status));
      }

      this.rows.set(schemes);
      this.totalRecords.set(total);
    } catch (error) {
      this.loggerService.LogError(error, 'SavingSchemesPage.load');
    } finally {
      this.isLoading.set(false);
      this.loaderService.stop();
    }
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => {
      this.pageIndex.set(0);
      this.load();
    }, 250);
  }

  toggleStatus(status: SavingSchemeStatus): void {
    const cur = this.statusFilters();
    if (cur.includes(status)) {
      this.statusFilters.set(cur.filter((s) => s !== status));
    } else {
      this.statusFilters.set([...cur, status]);
    }
    this.pageIndex.set(0);
    this.load();
  }

  isStatusActive(status: SavingSchemeStatus): boolean {
    return this.statusFilters().includes(status);
  }

  clearFilters(): void {
    this.statusFilters.set([]);
    this.searchQuery.set('');
    this.pageIndex.set(0);
    this.load();
  }

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  openEnroll(): void {
    this.showEnroll.set(true);
  }

  onEnrollClosed(): void {
    this.showEnroll.set(false);
  }

  onEnrolled(schemeGuid: string): void {
    this.showEnroll.set(false);
    if (schemeGuid) {
      this.router.navigate([schemeGuid], { relativeTo: this.route });
    } else {
      this.load();
    }
  }

  goToDetail(scheme: SavingScheme): void {
    this.router.navigate([scheme.schemeGuid], { relativeTo: this.route });
  }

  money(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    return this.moneyFmt.format(Number.isFinite(n) ? n : 0);
  }

  progressPercent(scheme: SavingScheme): number {
    const expected = Number(scheme.monthlyAmount ?? 0) * Number(scheme.tenureMonths ?? 0);
    if (!expected) return 0;
    const pct = (Number(scheme.totalPaid ?? 0) / expected) * 100;
    return Math.max(0, Math.min(100, pct));
  }

  statusClass(status: SavingSchemeStatus): string {
    return `status-chip status-chip--${status}`;
  }

  hasRows(): boolean {
    return this.rows().length > 0;
  }

  showEmpty(): boolean {
    return !this.isLoading() && !this.hasRows() && !this.searchQuery() && this.statusFilters().length === 0;
  }

  showNoResults(): boolean {
    return !this.isLoading() && !this.hasRows() && (!!this.searchQuery() || this.statusFilters().length > 0);
  }

  initialsFor(row: SavingScheme): string {
    const parts = (row.customerName ?? '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }
}
