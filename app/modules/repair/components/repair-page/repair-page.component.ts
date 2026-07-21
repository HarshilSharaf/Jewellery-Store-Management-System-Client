import { ChangeDetectorRef, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideWrench,
  lucideLoader,
  lucideEye,
  lucideTrash2,
  lucideCircleCheck,
  lucideCalendar,
} from '@ng-icons/lucide';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { RepairService } from '../../../../shared/services/Repair/repair.service';
import { RepairStatus, RepairTicket } from '../../../../interfaces/Repair/repair';

@Component({
  selector: 'app-repair-page',
  templateUrl: './repair-page.component.html',
  styleUrls: ['./repair-page.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideWrench,
      lucideLoader,
      lucideEye,
      lucideTrash2,
      lucideCircleCheck,
      lucideCalendar,
    }),
  ],
})
export class RepairPageComponent implements OnInit {

  readonly tickets = signal<RepairTicket[]>([]);
  readonly totalTickets = signal(0);
  readonly loading = signal(false);

  // Multi-select status filter — mirrors the karigar page's toggle pattern but
  // filters client-side after fetching so the P SP (which only accepts a single
  // status arg) doesn't need to be re-signatured.
  readonly statusFilters = signal<Set<RepairStatus>>(new Set());
  readonly searchQuery = signal('');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');

  readonly userType = signal<string>('employee');

  readonly statusOptions: { value: RepairStatus; label: string }[] = [
    { value: 'received',    label: 'Received' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'ready',       label: 'Ready' },
    { value: 'delivered',   label: 'Delivered' },
    { value: 'declined',    label: 'Declined' },
  ];

  private searchDebounce: any = null;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RepairService);
  private readonly loggerService = inject(LoggerService);
  private readonly loaderService = inject(NgxUiLoaderService);
  private readonly storeService = inject(StoreService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.storeService.get('authData').then((auth: any) => {
      this.userType.set(auth?.type ?? 'employee');
      this.cdRef.detectChanges();
    });
    this.loadTickets();
  }

  async loadTickets(): Promise<void> {
    try {
      this.loading.set(true);
      this.loaderService.start();

      const filters = this.statusFilters();
      const singleStatus = filters.size === 1 ? Array.from(filters)[0] : null;

      const rows: any[] = await this.service.getAll({
        status: singleStatus,
        customerSearch: this.searchQuery().trim() || null,
        dateFrom: this.dateFrom() || null,
        dateTo: this.dateTo() || null,
        pageSize: 100,
        page: 1,
      });

      const total = rows.find((r: any) => typeof r?.totalRecords === 'number')?.totalRecords ?? 0;
      let list: RepairTicket[] = rows.filter((r: any) => r?.ticketGuid) as RepairTicket[];

      // Client-side multi-status filter for when the user picks more than one.
      if (filters.size > 1) {
        list = list.filter(t => filters.has(t.status));
      }

      this.tickets.set(list);
      this.totalTickets.set(total);
    } catch (error) {
      this.loggerService.LogError(error, 'RepairPage.loadTickets');
    } finally {
      this.loading.set(false);
      this.loaderService.stop();
      this.cdRef.detectChanges();
    }
  }

  toggleStatus(status: RepairStatus): void {
    const next = new Set(this.statusFilters());
    if (next.has(status)) { next.delete(status); } else { next.add(status); }
    this.statusFilters.set(next);
    this.loadTickets();
  }

  isStatusActive(status: RepairStatus): boolean {
    return this.statusFilters().has(status);
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadTickets(), 250);
  }

  onDateFromChange(v: string): void { this.dateFrom.set(v); this.loadTickets(); }
  onDateToChange(v: string):   void { this.dateTo.set(v);   this.loadTickets(); }

  clearFilters(): void {
    this.statusFilters.set(new Set());
    this.searchQuery.set('');
    this.dateFrom.set('');
    this.dateTo.set('');
    this.loadTickets();
  }

  goToNew(): void {
    this.router.navigate(['new'], { relativeTo: this.route });
  }

  goToTicket(t: RepairTicket): void {
    this.router.navigate([t.ticketGuid], { relativeTo: this.route });
  }

  async markReady(t: RepairTicket, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    if (t.status === 'delivered' || t.status === 'declined' || t.status === 'ready') return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.updateStatus({
        ticketGuid: t.ticketGuid,
        newStatus: 'ready',
        actorUserId: auth?.uid ?? null,
      });
      this.toast.success('Marked ready', undefined, { timer: 1000 });
      this.loadTickets();
    } catch (error) {
      this.loggerService.LogError(error, 'RepairPage.markReady');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async deleteTicket(t: RepairTicket, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.dialog.danger(
      `Delete ${t.ticketNumber}?`,
      'The ticket will be hidden from lists (soft delete).',
      { confirmButtonText: 'Yes, delete' }
    );
    if (!confirmed) return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.delete(t.ticketGuid, auth?.uid ?? null);
      this.toast.success('Deleted', undefined, { timer: 900 });
      this.loadTickets();
    } catch (error) {
      this.loggerService.LogError(error, 'RepairPage.deleteTicket');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  initialsFor(name: string | undefined | null): string {
    if (!name) return '?';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }

  daysOpen(t: RepairTicket): number {
    const end = t.deliveredAt ? new Date(t.deliveredAt).getTime() : Date.now();
    const start = new Date(t.receivedAt).getTime();
    return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  }

  statusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  statusLabel(status: string | undefined): string {
    switch (status) {
      case 'in_progress': return 'In progress';
      case 'received':    return 'Received';
      case 'ready':       return 'Ready';
      case 'delivered':   return 'Delivered';
      case 'declined':    return 'Declined';
      default:            return status ?? '—';
    }
  }

  hasFilters(): boolean {
    return this.statusFilters().size > 0 || !!this.searchQuery() || !!this.dateFrom() || !!this.dateTo();
  }

  showEmpty(): boolean {
    return !this.loading() && this.tickets().length === 0 && !this.hasFilters();
  }

  showNoResults(): boolean {
    return !this.loading() && this.tickets().length === 0 && this.hasFilters();
  }

  canMarkReady(t: RepairTicket): boolean {
    return t.status === 'received' || t.status === 'in_progress';
  }
}
