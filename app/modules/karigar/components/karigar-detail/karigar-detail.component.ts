import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideLoader,
  lucidePlus,
  lucidePencil,
  lucideTrash2,
  lucidePhoneCall,
  lucideMapPin,
} from '@ng-icons/lucide';
import Swal from 'sweetalert2';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { KarigarFormComponent } from '../karigar-form/karigar-form.component';
import {
  Karigar,
  KarigarJob,
  KarigarLedgerEntry,
  KarigarLedgerSummary,
} from '../../../../interfaces/Karigar/karigar';

@Component({
  selector: 'app-karigar-detail',
  templateUrl: './karigar-detail.component.html',
  styleUrls: ['./karigar-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, DatePipe, DecimalPipe, KarigarFormComponent],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideLoader,
      lucidePlus,
      lucidePencil,
      lucideTrash2,
      lucidePhoneCall,
      lucideMapPin,
    }),
  ],
})
export class KarigarDetailComponent implements OnInit {

  readonly karigar = signal<Karigar | null>(null);
  readonly ledgerSummary = signal<KarigarLedgerSummary | null>(null);
  readonly ledger = signal<KarigarLedgerEntry[]>([]);
  readonly activeJobs = signal<KarigarJob[]>([]);
  readonly isLoading = signal(false);
  readonly userType = signal<string>('employee');

  readonly dateFrom = signal<string>(this.defaultFrom());
  readonly dateTo = signal<string>(this.today());

  readonly formOpen = signal(false);

  private karigarGuid = '';

  readonly netOwing = computed<number>(() => Number(this.ledgerSummary()?.netMetalOutstandingGrams ?? 0));
  readonly settledThisMonth = computed<number>(() => {
    // Sum of ledger entries of type=payment that occurred in current month.
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    let sum = 0;
    for (const l of this.ledger()) {
      if (l.entryType !== 'payment') continue;
      const d = new Date(l.txnDate);
      if (d.getTime() >= monthStart.getTime()) sum += Number(l.amount ?? 0);
    }
    return sum;
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(KarigarService);
  private readonly loggerService = inject(LoggerService);
  private readonly storeService = inject(StoreService);

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.karigarGuid = params['karigarGuid'];
      this.load();
    });
    this.storeService.get('authData').then((auth: any) => {
      this.userType.set(auth?.type ?? 'employee');
    });
  }

  async load(): Promise<void> {
    try {
      this.isLoading.set(true);
      // Fetch karigar summary + ledger + jobs in parallel.
      const [karigarsRows, ledgerRows, jobsRows]: any[] = await Promise.all([
        this.service.getAllKarigars(1000, 1, ''),
        this.service.getLedger(this.karigarGuid, this.dateFrom(), this.dateTo()),
        this.service.getAllJobs(50, 1, this.karigarGuid, null),
      ]);
      const k = (karigarsRows as any[]).find((r: any) => r?.karigarGuid === this.karigarGuid);
      this.karigar.set(k ?? null);

      const ledgerArr = Array.isArray(ledgerRows) ? ledgerRows : [];
      const summary = ledgerArr.find((r: any) => r?.karigarGuid) as KarigarLedgerSummary | undefined;
      const entries = ledgerArr.filter((r: any) => r?.ledgerGuid) as KarigarLedgerEntry[];
      this.ledgerSummary.set(summary ?? null);
      this.ledger.set(entries);

      const jobsArr = Array.isArray(jobsRows) ? jobsRows : [];
      const jobs = jobsArr.filter((r: any) => r?.jobGuid) as KarigarJob[];
      this.activeJobs.set(jobs.filter((j) => j.status === 'issued' || j.status === 'received'));
    } catch (error) {
      this.loggerService.LogError(error, 'KarigarDetail.load');
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/karigar']);
  }

  onDateFromChange(value: string): void {
    this.dateFrom.set(value);
    this.load();
  }

  onDateToChange(value: string): void {
    this.dateTo.set(value);
    this.load();
  }

  openIssueForKarigar(): void {
    const k = this.karigar();
    if (!k) return;
    this.router.navigate(['/karigar', 'jobs', 'new'], {
      queryParams: { karigarGuid: k.karigarGuid },
    });
  }

  openEdit(): void {
    this.formOpen.set(true);
  }

  onFormClosed(): void {
    this.formOpen.set(false);
  }

  onFormSaved(): void {
    this.formOpen.set(false);
    this.load();
  }

  async deleteKarigar(): Promise<void> {
    const k = this.karigar();
    if (!k) return;
    const result = await Swal.fire({
      title: `Delete ${k.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.deleteKarigar(k.karigarGuid, auth?.uid ?? null);
      Swal.fire({ title: 'Deleted', icon: 'success', timer: 900, showConfirmButton: false });
      this.router.navigate(['/karigar']);
    } catch (error) {
      this.loggerService.LogError(error, 'KarigarDetail.delete');
      Swal.fire('Error', (error as any)?.message ?? String(error), 'error');
    }
  }

  goToJob(j: KarigarJob): void {
    this.router.navigate(['/karigar', 'jobs', j.jobGuid]);
  }

  goToJobByGuid(jobGuid: string | undefined | null): void {
    if (!jobGuid) return;
    this.router.navigate(['/karigar', 'jobs', jobGuid]);
  }

  isAdmin(): boolean {
    return this.userType() === 'admin';
  }

  statusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  jobShort(jobGuid: string | undefined): string {
    if (!jobGuid) return '—';
    return `#${jobGuid.slice(0, 8)}`;
  }

  private defaultFrom(): string {
    const d = new Date();
    d.setDate(d.getDate() - 60);
    return this.formatDate(d);
  }

  private today(): string {
    return this.formatDate(new Date());
  }

  private formatDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
