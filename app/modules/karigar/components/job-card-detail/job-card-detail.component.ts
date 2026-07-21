import { ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideCheck,
  lucideX,
  lucideIndianRupee,
  lucideHammer,
  lucideLoader,
  lucidePackage,
} from '@ng-icons/lucide';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import {
  KarigarJob,
  KarigarLedgerEntry,
  KarigarIssuedStone,
} from '../../../../interfaces/Karigar/karigar';
import { SchemePaymentMode } from '../../../../interfaces/SavingSchemes/saving-scheme';

type PanelMode = 'receive' | 'settle' | null;

@Component({
  selector: 'app-job-card-detail',
  templateUrl: './job-card-detail.component.html',
  styleUrls: ['./job-card-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, DatePipe, DecimalPipe],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideCheck,
      lucideX,
      lucideIndianRupee,
      lucideHammer,
      lucideLoader,
      lucidePackage,
    }),
  ],
})
export class JobCardDetailComponent implements OnInit {

  readonly job = signal<KarigarJob | null>(null);
  readonly ledger = signal<KarigarLedgerEntry[]>([]);
  readonly stones = signal<KarigarIssuedStone[]>([]);
  readonly isLoading = signal(false);

  readonly panelMode = signal<PanelMode>(null);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  receiveForm: FormGroup;
  settleForm: FormGroup;

  readonly currentMode = signal<SchemePaymentMode>('cash');
  readonly modes: SchemePaymentMode[] = ['cash', 'cheque', 'online'];

  private jobGuid = '';

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(KarigarService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly fb = inject(FormBuilder);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);

  readonly daysOpen = computed<number>(() => {
    const j = this.job();
    if (!j) return 0;
    const start = new Date(j.issueDate).getTime();
    const end = j.receivedDate ? new Date(j.receivedDate).getTime() : Date.now();
    return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  });

  readonly amountDue = computed<number>(() => {
    const j = this.job();
    if (!j) return 0;
    const making = Number(j.makingCharge ?? 0);
    const paid = Number(j.settlementAmount ?? 0);
    return Math.max(0, making - paid);
  });

  constructor() {
    this.receiveForm = this.fb.group({
      receivedDate: [this.today(), Validators.required],
      receivedGrossWeight: [0, [Validators.required, Validators.min(0)]],
      receivedNetWeight: [0, [Validators.required, Validators.min(0)]],
      receivedStoneWeight: [0, [Validators.min(0)]],
      wastagePercentAllowed: [0, [Validators.min(0)]],
      wastageGramsActual: [0, [Validators.min(0)]],
      makingCharge: [0, [Validators.min(0)]],
      remarks: [''],
    });

    this.settleForm = this.fb.group({
      settlementAmount: [0, [Validators.required, Validators.min(0)]],
      paymentMode: ['cash', Validators.required],
      refNumber: [''],
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.jobGuid = params['jobGuid'];
      this.load();
    });
  }

  async load(): Promise<void> {
    try {
      this.isLoading.set(true);
      const rows: any = await this.service.getJobDetails(this.jobGuid);
      const flat = Array.isArray(rows) ? rows : [];
      const job = flat.find((r: any) => r?.jobGuid) as KarigarJob | undefined;
      const ledger = flat.filter((r: any) => r?.ledgerGuid) as KarigarLedgerEntry[];
      this.job.set(job ?? null);
      this.ledger.set(ledger);
      this.stones.set(this.parseStones(job?.issuedStones));
      if (job) {
        // Pre-fill receive form with gross weight of what was issued.
        this.receiveForm.patchValue({
          receivedGrossWeight: Number(job.issuedGrossWeight ?? 0),
          receivedNetWeight: Number(job.issuedGrossWeight ?? 0),
        });
        this.settleForm.patchValue({
          settlementAmount: Number(job.makingCharge ?? 0),
        });
      }
    } catch (error) {
      this.loggerService.LogError(error, 'JobCardDetail.load');
    } finally {
      this.isLoading.set(false);
      this.cdRef.detectChanges();
    }
  }

  private parseStones(stones: any): KarigarIssuedStone[] {
    if (!stones) return [];
    if (Array.isArray(stones)) return stones as KarigarIssuedStone[];
    if (typeof stones === 'string') {
      try {
        const parsed = JSON.parse(stones);
        return Array.isArray(parsed) ? (parsed as KarigarIssuedStone[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  goBack(): void {
    this.router.navigate(['/karigar']);
  }

  openReceive(): void {
    this.panelMode.set('receive');
    this.errorMessage.set(null);
  }

  openSettle(): void {
    this.panelMode.set('settle');
    this.currentMode.set('cash');
    this.settleForm.patchValue({ paymentMode: 'cash' });
    this.errorMessage.set(null);
  }

  closePanel(): void {
    this.panelMode.set(null);
  }

  setMode(mode: SchemePaymentMode): void {
    this.currentMode.set(mode);
    this.settleForm.patchValue({ paymentMode: mode });
  }

  async receiveJob(): Promise<void> {
    if (!this.receiveForm.valid || this.saving()) return;
    const j = this.job();
    if (!j?.jobGuid) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      const auth: any = await this.storeService.get('authData');
      const value = this.receiveForm.value;
      await this.service.receiveJob({
        jobGuid: j.jobGuid,
        receivedDate: value.receivedDate,
        receivedGrossWeight: Number(value.receivedGrossWeight),
        receivedNetWeight: Number(value.receivedNetWeight),
        receivedStoneWeight: Number(value.receivedStoneWeight ?? 0),
        wastagePercentAllowed: Number(value.wastagePercentAllowed ?? 0),
        wastageGramsActual: Number(value.wastageGramsActual ?? 0),
        makingCharge: Number(value.makingCharge ?? 0),
        remarks: value.remarks || null,
        actorUserId: auth?.uid ?? null,
      });
      this.saving.set(false);
      this.closePanel();
      await this.load();
      this.toast.success('Job received', undefined, { timer: 900 });
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'JobCardDetail.receiveJob');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async settleJob(): Promise<void> {
    if (!this.settleForm.valid || this.saving()) return;
    const j = this.job();
    if (!j?.jobGuid) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      const auth: any = await this.storeService.get('authData');
      const value = this.settleForm.value;
      await this.service.settleJob({
        jobGuid: j.jobGuid,
        settlementAmount: Number(value.settlementAmount),
        paymentMode: value.paymentMode as SchemePaymentMode,
        refNumber: value.refNumber || null,
        actorUserId: auth?.uid ?? null,
      });
      this.saving.set(false);
      this.closePanel();
      await this.load();
      this.toast.success('Job settled', undefined, { timer: 900 });
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'JobCardDetail.settleJob');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  goToKarigar(): void {
    const j = this.job();
    if (!j?.karigarGuid) return;
    this.router.navigate(['/karigar', 'karigars', j.karigarGuid]);
  }

  statusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  jobShort(jobGuid: string | undefined | null): string {
    if (!jobGuid) return '';
    return jobGuid.slice(0, 8);
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
