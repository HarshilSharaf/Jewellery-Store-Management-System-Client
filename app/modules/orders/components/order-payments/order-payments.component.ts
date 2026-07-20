import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideIndianRupee, lucideX, lucideCheck } from '@ng-icons/lucide';
import Swal from 'sweetalert2';
import { PaymentsDataModel, PaymentType } from '../../models/payments-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';

type Mode = 'cash' | 'cheque' | 'online';

@Component({
  selector: 'app-order-payments',
  templateUrl: './order-payments.component.html',
  styleUrls: ['./order-payments.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideIndianRupee, lucideX, lucideCheck })],
})
export class OrderPaymentsComponent implements OnInit {

  _paymentsData: PaymentsDataModel[] = [];
  @Input() set paymentsData(data: PaymentsDataModel[]) {
    this._paymentsData = Array.isArray(data) ? [...data] : [];
    this.totalPaid.set(this._paymentsData.reduce((s, p) => s + Number(p.amount ?? 0), 0));
  }

  @Input() orderGuid = '';
  @Input() isPaymentDone = false;
  @Input() isCancelled = false;
  @Input() grandTotal = 0;
  @Input() invoiceNumber = '';

  @Input() open = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() refreshPaymentsData = new EventEmitter<boolean>();

  readonly totalPaid = signal(0);
  readonly outstanding = signal(0);
  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  recordPaymentForm: FormGroup;
  private readonly initialFormValue: unknown;

  constructor(
    private fb: FormBuilder,
    private orderService: OrderService,
    private loggerService: LoggerService,
  ) {
    this.recordPaymentForm = this.fb.group({
      amount: [0, [Validators.required, Validators.min(1)]],
      paymentType: ['cash' as Mode, Validators.required],
      refNumber: [''],
      paymentDate: [this.formatDate(new Date()), Validators.required],
      remarks: [''],
    });
    this.initialFormValue = this.recordPaymentForm.value;
    this.recordPaymentForm.get('paymentType')!.valueChanges.subscribe((val) => {
      const ref = this.recordPaymentForm.get('refNumber');
      if (!ref) return;
      if (val === 'cash') {
        ref.disable({ emitEvent: false });
        ref.setValue('', { emitEvent: false });
        ref.clearValidators();
      } else {
        ref.enable({ emitEvent: false });
        ref.setValidators([Validators.required]);
      }
      ref.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.recordPaymentForm.get('refNumber')!.disable({ emitEvent: false });
    this.recalcOutstanding();
  }

  recalcOutstanding(): void {
    this.outstanding.set(Math.max(0, Number(this.grandTotal || 0) - this.totalPaid()));
  }

  openPanel(): void {
    this.errorMessage.set(null);
    this.recordPaymentForm.reset({
      ...(this.initialFormValue as any),
      amount: Math.max(0, this.outstanding() || 0),
      paymentDate: this.formatDate(new Date()),
    });
    this.recordPaymentForm.get('refNumber')!.disable({ emitEvent: false });
    this.open = true;
    this.openChange.emit(true);
  }

  closePanel(): void {
    this.open = false;
    this.openChange.emit(false);
  }

  setMode(mode: Mode): void {
    this.recordPaymentForm.get('paymentType')!.setValue(mode);
  }

  currentMode(): Mode {
    return this.recordPaymentForm.get('paymentType')!.value as Mode;
  }

  recordPayment(): void {
    if (this.recordPaymentForm.invalid || this.saving()) {
      this.recordPaymentForm.markAllAsTouched();
      return;
    }
    this.loggerService.LogInfo('recordPayment() Request Started.');
    this.saving.set(true);
    this.errorMessage.set(null);

    const raw = this.recordPaymentForm.getRawValue() as {
      amount: number;
      paymentType: Mode;
      refNumber: string;
      paymentDate: string;
      remarks: string;
    };

    this.orderService
      .recordPayment({
        orderGuid: this.orderGuid,
        paymentAmount: Number(raw.amount),
        paymentType: raw.paymentType,
        refNumber: raw.refNumber || null,
        paymentDate: raw.paymentDate,
        remarks: raw.remarks,
      })
      .then((response: any) => {
        this.saving.set(false);
        const msg = Array.isArray(response) && response[0]?.message;
        if (msg) {
          this.errorMessage.set(msg);
          this.loggerService.LogError(msg, 'recordPayment()');
          return;
        }
        this.refreshPaymentsData.emit(true);
        Swal.fire({
          title: 'Payment recorded',
          text: this.invoiceNumber ? `Against ${this.invoiceNumber}` : undefined,
          icon: 'success',
          timer: 1600,
          showConfirmButton: false,
        });
        this.closePanel();
      })
      .catch((error: any) => {
        this.saving.set(false);
        const msg = typeof error === 'string' ? error : error?.message ?? 'Failed to record payment';
        this.errorMessage.set(msg);
        this.loggerService.LogError(error, 'recordPayment()');
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) this.closePanel();
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
  }

  formatMoney(v: any): string {
    const n = Number(v ?? 0);
    return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
      Number.isFinite(n) ? n : 0,
    );
  }

  paymentModeLabel(t: PaymentType | string): string {
    switch (String(t).toLowerCase()) {
      case 'cash': return 'Cash';
      case 'cheque': return 'Cheque';
      case 'online': return 'Online';
      case 'upi': return 'UPI';
      case 'card': return 'Card';
      default: return String(t);
    }
  }
}
