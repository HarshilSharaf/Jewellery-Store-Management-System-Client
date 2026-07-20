import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideHammer,
  lucideLoader,
  lucidePhone,
  lucidePencil,
  lucideTrash2,
  lucideExternalLink,
  lucideCircleAlert,
} from '@ng-icons/lucide';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { KarigarFormComponent } from '../karigar-form/karigar-form.component';
import { Karigar, KarigarJob, KarigarJobStatus } from '../../../../interfaces/Karigar/karigar';

type Tab = 'karigars' | 'jobs';

@Component({
  selector: 'app-karigar-page',
  templateUrl: './karigar-page.component.html',
  styleUrls: ['./karigar-page.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, KarigarFormComponent, DatePipe],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideHammer,
      lucideLoader,
      lucidePhone,
      lucidePencil,
      lucideTrash2,
      lucideExternalLink,
      lucideCircleAlert,
    }),
  ],
})
export class KarigarPageComponent implements OnInit {

  readonly activeTab = signal<Tab>('karigars');

  readonly karigars = signal<Karigar[]>([]);
  readonly totalKarigars = signal(0);
  readonly loadingKarigars = signal(false);

  readonly jobs = signal<KarigarJob[]>([]);
  readonly totalJobs = signal(0);
  readonly loadingJobs = signal(false);
  readonly statusFilter = signal<KarigarJobStatus | null>(null);
  readonly karigarFilter = signal<string | null>(null);

  readonly searchKarigars = signal('');
  private searchDebounce: any = null;

  readonly formOpen = signal(false);
  readonly editing = signal<Karigar | null>(null);
  readonly userType = signal<string>('employee');

  readonly statusOptions: { value: KarigarJobStatus; label: string }[] = [
    { value: 'issued', label: 'Issued' },
    { value: 'received', label: 'Received' },
    { value: 'settled', label: 'Settled' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(KarigarService);
  private readonly loggerService = inject(LoggerService);
  private readonly loaderService = inject(NgxUiLoaderService);
  private readonly storeService = inject(StoreService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

  ngOnInit(): void {
    this.storeService.get('authData').then((auth: any) => {
      this.userType.set(auth?.type ?? 'employee');
    });
    this.loadKarigars();
    this.loadJobs();
  }

  selectTab(t: Tab): void {
    this.activeTab.set(t);
  }

  async loadKarigars(): Promise<void> {
    try {
      this.loadingKarigars.set(true);
      this.loaderService.start();
      const result: any = await this.service.getAllKarigars(50, 1, this.searchKarigars().trim());
      const rows = Array.isArray(result) ? result : [];
      const total = rows.find((r: any) => typeof r?.totalRecords === 'number')?.totalRecords ?? 0;
      const list: Karigar[] = rows.filter((r: any) => r?.karigarGuid) as Karigar[];
      this.karigars.set(list);
      this.totalKarigars.set(total);
    } catch (error) {
      this.loggerService.LogError(error, 'KarigarPage.loadKarigars');
    } finally {
      this.loadingKarigars.set(false);
      this.loaderService.stop();
    }
  }

  async loadJobs(): Promise<void> {
    try {
      this.loadingJobs.set(true);
      const result: any = await this.service.getAllJobs(50, 1, this.karigarFilter(), this.statusFilter());
      const rows = Array.isArray(result) ? result : [];
      const total = rows.find((r: any) => typeof r?.totalRecords === 'number')?.totalRecords ?? 0;
      const list: KarigarJob[] = rows.filter((r: any) => r?.jobGuid) as KarigarJob[];
      this.jobs.set(list);
      this.totalJobs.set(total);
    } catch (error) {
      this.loggerService.LogError(error, 'KarigarPage.loadJobs');
    } finally {
      this.loadingJobs.set(false);
    }
  }

  onSearchInput(value: string): void {
    this.searchKarigars.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(() => this.loadKarigars(), 250);
  }

  toggleStatus(status: KarigarJobStatus): void {
    this.statusFilter.set(this.statusFilter() === status ? null : status);
    this.loadJobs();
  }

  isStatusActive(status: KarigarJobStatus): boolean {
    return this.statusFilter() === status;
  }

  onKarigarFilterChange(value: string): void {
    this.karigarFilter.set(value || null);
    this.loadJobs();
  }

  clearJobFilters(): void {
    this.statusFilter.set(null);
    this.karigarFilter.set(null);
    this.loadJobs();
  }

  openAdd(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  openEdit(k: Karigar, event: MouseEvent): void {
    event.stopPropagation();
    this.editing.set(k);
    this.formOpen.set(true);
  }

  onFormClosed(): void {
    this.formOpen.set(false);
    this.editing.set(null);
  }

  onFormSaved(): void {
    this.formOpen.set(false);
    this.editing.set(null);
    this.loadKarigars();
  }

  goToKarigar(k: Karigar): void {
    this.router.navigate(['karigars', k.karigarGuid], { relativeTo: this.route });
  }

  goToJob(j: KarigarJob): void {
    this.router.navigate(['jobs', j.jobGuid], { relativeTo: this.route });
  }

  openIssue(): void {
    this.router.navigate(['jobs', 'new'], { relativeTo: this.route });
  }

  async deleteKarigar(k: Karigar, event: MouseEvent): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.dialog.danger(
      `Delete ${k.name}?`,
      'Karigar will be hidden from lists (soft delete).',
      { confirmButtonText: 'Yes, delete' }
    );
    if (!confirmed) return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.deleteKarigar(k.karigarGuid, auth?.uid ?? null);
      this.loadKarigars();
      this.toast.success('Deleted', undefined, { timer: 900 });
    } catch (error) {
      this.loggerService.LogError(error, 'KarigarPage.deleteKarigar');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    }
  }

  initialsFor(k: Karigar): string {
    const parts = (k.name ?? '').trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase() || '?';
  }

  daysSince(iso: string | undefined | null): number {
    if (!iso) return 0;
    const then = new Date(iso).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((now - then) / (1000 * 60 * 60 * 24)));
  }

  statusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  jobShort(jobGuid: string | undefined): string {
    if (!jobGuid) return '—';
    return `#${jobGuid.slice(0, 8)}`;
  }

  showEmptyKarigars(): boolean {
    return !this.loadingKarigars() && this.karigars().length === 0 && !this.searchKarigars();
  }

  showNoKarigarResults(): boolean {
    return !this.loadingKarigars() && this.karigars().length === 0 && !!this.searchKarigars();
  }

  showEmptyJobs(): boolean {
    return !this.loadingJobs() && this.jobs().length === 0
      && !this.statusFilter() && !this.karigarFilter();
  }

  showNoJobResults(): boolean {
    return !this.loadingJobs() && this.jobs().length === 0
      && (!!this.statusFilter() || !!this.karigarFilter());
  }
}
