import { ChangeDetectorRef, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideIndianRupee,
  lucideX,
  lucideLoader,
  lucideCircleCheck,
  lucideCircleX,
  lucideCircleAlert,
  lucideCheck,
  lucidePlus,
  lucidePhoneCall,
  lucideMapPin,
  lucideCopy,
  lucidePrinter,
} from '@ng-icons/lucide';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { SavingSchemesService } from '../../../../shared/services/SavingSchemes/saving-schemes.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import {
  SavingScheme,
  SavingSchemeInstallment,
  SchemePaymentMode,
} from '../../../../interfaces/SavingSchemes/saving-scheme';

@Component({
  selector: 'app-saving-scheme-detail',
  templateUrl: './saving-scheme-detail.component.html',
  styleUrls: ['./saving-scheme-detail.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideIndianRupee,
      lucideX,
      lucideLoader,
      lucideCircleCheck,
      lucideCircleX,
      lucideCircleAlert,
      lucideCheck,
      lucidePlus,
      lucidePhoneCall,
      lucideMapPin,
      lucideCopy,
      lucidePrinter,
    }),
  ],
})
export class SavingSchemeDetailComponent implements OnInit {

  readonly scheme = signal<SavingScheme | null>(null);
  readonly installments = signal<SavingSchemeInstallment[]>([]);
  readonly isLoading = signal(false);
  readonly userType = signal<string>('employee');

  readonly showRecord = signal(false);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  installmentForm: FormGroup;

  readonly modes: SchemePaymentMode[] = ['cash', 'cheque', 'online'];
  readonly currentMode = signal<SchemePaymentMode>('cash');

  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly schemesService = inject(SavingSchemesService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly permissions = inject(PermissionsService);

  private schemeGuid = '';

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });
  private readonly moneyFmt2 = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly balanceToPay = computed<number>(() => {
    const s = this.scheme();
    if (!s) return 0;
    const expected = Number(s.monthlyAmount ?? 0) * Number(s.tenureMonths ?? 0);
    return Math.max(0, expected - Number(s.totalPaid ?? 0));
  });

  readonly expectedCorpus = computed<number>(() => {
    const s = this.scheme();
    if (!s) return 0;
    const contribution = Number(s.monthlyAmount ?? 0) * Number(s.tenureMonths ?? 0);
    const bonus = Number(s.monthlyAmount ?? 0) * Number(s.bonusInstallments ?? 0);
    return contribution + bonus;
  });

  readonly progressPercent = computed<number>(() => {
    const s = this.scheme();
    if (!s) return 0;
    const expected = Number(s.monthlyAmount ?? 0) * Number(s.tenureMonths ?? 0);
    if (!expected) return 0;
    return Math.max(0, Math.min(100, (Number(s.totalPaid ?? 0) / expected) * 100));
  });

  constructor() {
    this.installmentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentMode: ['cash' as SchemePaymentMode, Validators.required],
      refNumber: [''],
      receiptDate: [this.today()],
      allowMultipleThisMonth: [false],
    });
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.schemeGuid = params['schemeGuid'];
      this.load();
    });

    this.storeService.get('authData').then((auth: any) => {
      this.userType.set(auth?.type ?? 'employee');
      this.cdRef.detectChanges();
    });

    // Load RBAC permissions (cached) so canForfeit() reflects the real flag.
    this.permissions.getUserPermissions().then(() => this.cdRef.detectChanges());
  }

  async load(): Promise<void> {
    try {
      this.isLoading.set(true);
      const rows: any = await this.schemesService.getDetails(this.schemeGuid);
      const flat = Array.isArray(rows) ? rows : [];
      const scheme = flat.find((r: any) => r?.schemeGuid);
      const insts = flat.filter((r: any) => r?.installmentGuid);
      this.scheme.set(scheme ?? null);
      this.installments.set(insts as SavingSchemeInstallment[]);
      if (scheme) {
        this.installmentForm.patchValue({ amount: Number(scheme.monthlyAmount ?? 0) });
      }
    } catch (error) {
      this.loggerService.LogError(error, 'SavingSchemeDetail.load');
    } finally {
      this.isLoading.set(false);
      this.cdRef.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/saving-schemes']);
  }

  goToCustomer(): void {
    const s = this.scheme();
    if (!s?.customerGuid) return;
    this.router.navigate(['/customers/view-customer-details', s.customerGuid]);
  }

  isAdmin(): boolean {
    return this.userType() === 'admin';
  }

  isActive(): boolean {
    return this.scheme()?.status === 'active';
  }

  isMatured(): boolean {
    return this.scheme()?.status === 'matured';
  }

  canRecordInstallment(): boolean {
    return this.isActive();
  }

  canRedeem(): boolean {
    const s = this.scheme();
    return s?.status === 'matured' || (s?.status === 'active' && !!s?.isEligibleForRedemption);
  }

  canForfeit(): boolean {
    // Gated by the dedicated RBAC flag (admin default true, manager/employee
    // false) rather than a hardcoded admin check.
    return this.permissions.canForfeitSavingScheme() && this.isActive();
  }

  openRecord(): void {
    if (!this.canRecordInstallment()) return;
    const s = this.scheme();
    this.installmentForm.reset({
      amount: Number(s?.monthlyAmount ?? 0),
      paymentMode: 'cash',
      refNumber: '',
      receiptDate: this.today(),
      allowMultipleThisMonth: false,
    });
    this.currentMode.set('cash');
    this.errorMessage.set(null);
    this.showRecord.set(true);
  }

  closeRecord(): void {
    this.showRecord.set(false);
  }

  setMode(mode: SchemePaymentMode): void {
    this.currentMode.set(mode);
    this.installmentForm.patchValue({ paymentMode: mode });
  }

  async recordInstallment(): Promise<void> {
    if (!this.installmentForm.valid || this.saving()) return;
    const s = this.scheme();
    if (!s?.schemeGuid) return;

    this.saving.set(true);
    this.errorMessage.set(null);
    try {
      const authData: any = await this.storeService.get('authData');
      const value = this.installmentForm.value;
      await this.schemesService.recordInstallment({
        schemeGuid: s.schemeGuid,
        amount: Number(value.amount),
        paymentMode: value.paymentMode as SchemePaymentMode,
        refNumber: value.refNumber ?? null,
        receiptDate: value.receiptDate,
        actorUserId: authData?.uid ?? null,
        allowMultipleThisMonth: !!value.allowMultipleThisMonth,
      });
      this.saving.set(false);
      this.showRecord.set(false);
      await this.load();
      this.toast.success('Installment recorded', undefined, { timer: 1400 });
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'SavingSchemeDetail.recordInstallment');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async forfeit(): Promise<void> {
    if (!this.canForfeit()) return;
    const s = this.scheme();
    if (!s?.schemeGuid) return;
    const reason = await this.dialog.prompt('Forfeit this scheme?', {
      text: 'Bonus is forfeited; only the customer contribution stays on record.',
      icon: 'warning',
      variant: 'danger',
      input: 'text',
      inputPlaceholder: 'Reason (kept on file)',
      confirmButtonText: 'Yes, forfeit',
    });
    if (reason === null) return;
    try {
      const authData: any = await this.storeService.get('authData');
      await this.schemesService.forfeit({
        schemeGuid: s.schemeGuid,
        reason: reason || 'No reason recorded',
        actorUserId: authData?.uid ?? null,
      });
      await this.load();
      this.toast.success('Forfeited', undefined, { timer: 1400 });
    } catch (error) {
      this.loggerService.LogError(error, 'SavingSchemeDetail.forfeit');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  redeemViaCart(): void {
    const s = this.scheme();
    if (!s?.schemeGuid) return;
    // Cart-builder (I's) will pick up the pre-attached scheme guid when
    // the customer starts a new invoice. We route to the sell flow with
    // a query hint; the cart-builder reads localStorage for handoff.
    localStorage.setItem('pendingSchemeGuid', s.schemeGuid);
    this.router.navigate(['/orders/prepare-order'], {
      queryParams: { schemeGuid: s.schemeGuid, customerGuid: s.customerGuid },
    });
  }

  copyReceipt(inst: SavingSchemeInstallment): void {
    const s = this.scheme();
    if (!s || !inst) return;
    const receipt = [
      `Scheme: ${s.planName}`,
      `Customer: ${s.customerName}`,
      `Installment #${inst.installmentNumber} of ${s.tenureMonths}`,
      `Amount: Rs. ${this.money(inst.amount)}`,
      `Mode: ${inst.paymentMode}`,
      inst.refNumber ? `Ref: ${inst.refNumber}` : '',
      `Received: ${inst.receiptDate}`,
    ].filter(Boolean).join('\n');
    if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      (navigator as any).clipboard.writeText(receipt);
      this.toast.success('Copied receipt', undefined, { timer: 900 });
    }
  }

  money(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyFmt.format(Number.isFinite(n) ? n : 0);
  }

  money2(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyFmt2.format(Number.isFinite(n) ? n : 0);
  }

  statusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  private today(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
