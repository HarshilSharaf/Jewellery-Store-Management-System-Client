import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePrinter,
  lucideIndianRupee,
  lucideCircleAlert,
  lucideFileText,
  lucideCopy,
  lucideMessageCircle,
  lucideBan,
} from '@ng-icons/lucide';
import Swal from 'sweetalert2';

import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { InvoiceDataModel } from '../../models/invoice-data-model';
import { PaymentsDataModel } from '../../models/payments-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { CustomerDetails } from '../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';
import { OrderProductsDetailsComponent } from '../order-products-details/order-products-details.component';
import { OrderPaymentsComponent } from '../order-payments/order-payments.component';
import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { numberToIndianRupees } from '../../../../shared/utils/amount-in-words';

@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, OrderProductsDetailsComponent, OrderPaymentsComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePrinter,
      lucideIndianRupee,
      lucideCircleAlert,
      lucideFileText,
      lucideCopy,
      lucideMessageCircle,
      lucideBan,
    }),
  ],
})
export class OrderDetailsComponent implements OnInit {

  @ViewChild(OrderPaymentsComponent) paymentsPanel?: OrderPaymentsComponent;

  orderGuid = '';
  readonly loading = signal(true);
  readonly orderData = signal<InvoiceDataModel | null>(null);
  readonly customerData = signal<CustomerDetails | null>(null);
  readonly productsData = signal<InvoiceProductDataModel[]>([]);
  readonly paymentsData = signal<PaymentsDataModel[]>([]);

  readonly grandTotal = signal(0);
  readonly subTotalTaxable = signal(0);
  readonly totalCgst = signal(0);
  readonly totalSgst = signal(0);
  readonly totalIgst = signal(0);
  readonly totalMakingAmount = signal(0);
  readonly totalWastageAmount = signal(0);
  readonly totalStoneAmount = signal(0);
  readonly totalDiscountAmount = signal(0);
  readonly oldGoldCreditAmount = signal(0);
  readonly roundOffAmount = signal(0);
  readonly invoiceNumber = signal('');
  readonly cancelReason = signal<string | null>(null);
  readonly totalPaymentReceived = signal(0);
  readonly isInterState = signal(false);

  paymentsPanelOpen = false;
  readonly permissions = inject(PermissionsService);

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private fsService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private utilityService: UtilityService,
    private shopSettingsService: ShopSettingsService,
  ) {}

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.orderGuid = params['orderGuid'];
      this.getOrderDetails();
    });
  }

  getOrderDetails(): void {
    this.loading.set(true);
    this.loaderService.start();
    this.loggerService.LogInfo('getOrderDetails() Request Started.');
    this.orderService
      .getOrderDetails(this.orderGuid)
      .then(async (response: any) => {
        const row = Array.isArray(response) && Array.isArray(response[0]) ? response[0][0] : response[0];
        if (!row) {
          this.loading.set(false);
          this.loaderService.stop();
          return;
        }

        const orderData = row as InvoiceDataModel;
        const grand = Number(row.grandTotal ?? row.totalAmountWithGst ?? 0);
        this.grandTotal.set(grand);
        this.subTotalTaxable.set(Number(row.subTotalTaxable ?? 0));
        this.totalCgst.set(Number(row.totalCgst ?? 0));
        this.totalSgst.set(Number(row.totalSgst ?? 0));
        this.totalIgst.set(Number(row.totalIgst ?? 0));
        this.totalMakingAmount.set(Number(row.totalMakingCharge ?? 0));
        this.totalWastageAmount.set(Number(row.totalWastageCharge ?? 0));
        this.totalStoneAmount.set(Number(row.totalStoneCharge ?? 0));
        this.totalDiscountAmount.set(Number(row.totalDiscount ?? 0));
        this.oldGoldCreditAmount.set(Number(row.oldGoldCreditAmount ?? 0));
        this.roundOffAmount.set(Number(row.roundOffAmount ?? 0));
        this.invoiceNumber.set(row.invoiceNumber ?? '');
        this.cancelReason.set(row.cancelReason ?? null);

        const cust = (row.customerDetails ?? row.customer_details ?? {}) as CustomerDetails;
        if (cust?.imagePath) {
          cust.imagePath = this.utilityService.getFilePath(
            this.fsService.customerImagesDir + '\\' + cust.imagePath,
          );
        }
        this.customerData.set(cust);
        orderData.customer_details = cust;
        orderData.customerDetails = cust;

        const rawLines = row.lineItems ?? row.invoice_products ?? [];
        const lines = Array.isArray(rawLines) ? (rawLines as InvoiceProductDataModel[]) : [];
        this.productsData.set(lines);
        orderData.lineItems = lines;
        orderData.invoice_products = lines;

        const payments = Array.isArray(row.payments) ? (row.payments as PaymentsDataModel[]) : [];
        this.paymentsData.set(payments);
        this.totalPaymentReceived.set(payments.reduce((s, p) => s + Number(p.amount ?? 0), 0));

        this.orderData.set(orderData);

        // Determine intra vs inter-state from ShopSettings + customer
        try {
          const shop = await this.shopSettingsService.get();
          const posMatch = (row.placeOfSupply ?? '').match(/\((\d{1,2})\)/);
          const posCode = posMatch?.[1] ?? cust?.stateCode ?? shop?.stateCode;
          const shopCode = shop?.stateCode;
          this.isInterState.set(!!shopCode && !!posCode && String(shopCode).trim() !== String(posCode).trim());
        } catch { /* leave default */ }

        this.loading.set(false);
        this.loaderService.stop();
        this.loggerService.LogInfo('getOrderDetails() Request Completed.');
      })
      .catch((error: any) => {
        this.loading.set(false);
        this.loaderService.stop();
        this.loggerService.LogError(error, 'getOrderDetails()');
      });
  }

  goToPrint(): void {
    this.router.navigate([`/orders/print-invoice/${this.orderGuid}`], {
      state: {
        orderData: this.orderData(),
        customerData: this.customerData(),
        productsData: this.productsData(),
        paymentsData: this.paymentsData(),
      },
    });
  }

  openPayments(): void {
    if (!this.paymentsPanel) return;
    this.paymentsPanel.openPanel();
  }

  outstanding(): number {
    return Math.max(0, this.grandTotal() - this.totalPaymentReceived());
  }

  paymentStatus(): 'paid' | 'unpaid' | 'partial' | 'cancelled' {
    if (this.orderData()?.cancelledAt) return 'cancelled';
    if (this.orderData()?.isPaymentDone) return 'paid';
    if (this.totalPaymentReceived() > 0) return 'partial';
    return 'unpaid';
  }

  paymentStatusLabel(): string {
    switch (this.paymentStatus()) {
      case 'paid': return 'Paid';
      case 'unpaid': return 'Unpaid';
      case 'partial': return 'Partial';
      case 'cancelled': return 'Cancelled';
    }
  }

  paymentStatusChipClass(): string {
    switch (this.paymentStatus()) {
      case 'paid': return 'status-chip status-chip--paid';
      case 'cancelled': return 'status-chip status-chip--cancelled';
      default: return 'status-chip status-chip--unpaid';
    }
  }

  money(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyFmt.format(Number.isFinite(n) ? n : 0);
  }

  amountInWords(): string {
    return numberToIndianRupees(this.grandTotal());
  }

  cancelInvoice(): void {
    if (this.orderData()?.cancelledAt) return;
    Swal.fire({
      title: 'Cancel this invoice?',
      html: `<span style="color: var(--color-fg-muted)">${this.invoiceNumber()}</span>`,
      input: 'text',
      inputPlaceholder: 'Reason (optional)',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep it',
    }).then((result) => {
      if (!result.isConfirmed) return;
      const reason = (result.value as string) || null;
      this.orderService
        .cancelOrder(this.orderGuid, reason)
        .then((data: any) => {
          const message = Array.isArray(data) && data[0]?.message;
          if (message) {
            Swal.fire('Error', message, 'error');
            return;
          }
          Swal.fire('Cancelled', 'Invoice cancelled.', 'success');
          this.getOrderDetails();
        })
        .catch((error: any) => {
          Swal.fire('Error', error?.toString?.() ?? 'Failed to cancel', 'error');
          this.loggerService.LogError(error, 'cancelOrder()');
        });
    });
  }

  stubToast(message: string): void {
    Swal.fire({
      title: message,
      text: 'Coming soon.',
      icon: 'info',
      timer: 1400,
      showConfirmButton: false,
    });
  }
}
