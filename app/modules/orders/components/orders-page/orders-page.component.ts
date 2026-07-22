import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideReceipt,
  lucideFilePlus,
  lucidePrinter,
  lucideExternalLink,
  lucideTrash2,
  lucideCalendarDays,
  lucideCheck,
  lucideX,
  lucideSearch,
} from '@ng-icons/lucide';
import { OrdersDataModel, PaymentStatus } from '../../models/orders-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import {
  SimplePaginatorComponent,
  SimplePageEvent,
} from '../../../../shared/components/simple-paginator/simple-paginator.component';

type StatusFilter = 'all' | 'paid' | 'unpaid' | 'cancelled';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, NgIcon, SimplePaginatorComponent],
  viewProviders: [
    provideIcons({
      lucideReceipt,
      lucideFilePlus,
      lucidePrinter,
      lucideExternalLink,
      lucideTrash2,
      lucideCalendarDays,
      lucideCheck,
      lucideX,
      lucideSearch,
    }),
  ],
})
export class OrdersPageComponent implements OnInit {

  readonly search = new FormControl<string>('', { nonNullable: true });
  readonly fromDate = new FormControl<string>('', { nonNullable: true });
  readonly toDate = new FormControl<string>('', { nonNullable: true });
  readonly statusFilter = signal<StatusFilter>('all');

  readonly orders = signal<OrdersDataModel[]>([]);
  readonly totalRecords = signal<number>(0);
  readonly isLoading = signal<boolean>(false);

  pageIndex = 0;
  pageSize = 10;

  readonly permissions = inject(PermissionsService);

  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  readonly moneyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  readonly visibleOrders = computed<OrdersDataModel[]>(() => {
    const list = this.orders();
    const status = this.statusFilter();
    const from = this.fromDate.value ? new Date(this.fromDate.value).getTime() : null;
    const to = this.toDate.value ? new Date(this.toDate.value).getTime() + 86_399_000 : null;

    return list.filter((row) => {
      if (status === 'paid' && !(row.isPaymentDone && !row.cancelledAt)) return false;
      if (status === 'unpaid' && !(!row.isPaymentDone && !row.cancelledAt)) return false;
      if (status === 'cancelled' && !row.cancelledAt) return false;
      if (from || to) {
        const t = row.orderDate ? new Date(row.orderDate).getTime() : 0;
        if (from && t < from) return false;
        if (to && t > to) return false;
      }
      return true;
    });
  });

  constructor(
    private ordersService: OrderService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.getAllOrders();
    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = setTimeout(() => {
        this.pageIndex = 0;
        this.getAllOrders(val ?? '');
      }, 250);
    });
  }

  setStatusFilter(next: StatusFilter) {
    this.statusFilter.set(next);
  }

  clearDateRange() {
    this.fromDate.setValue('');
    this.toDate.setValue('');
  }

  onPageChange(event: SimplePageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getAllOrders();
  }

  getAllOrders(searchOverride?: string) {
    const searchQuery = searchOverride ?? this.search.value ?? '';
    this.isLoading.set(true);
    this.loaderService.start();
    this.loggerService.LogInfo('getAllOrders() Request Started.');
    this.ordersService
      .getAllOrders(this.pageSize, this.pageIndex + 1, searchQuery)
      .then((response: any) => {
        this.totalRecords.set(Number(response?.[0]?.totalRecords ?? 0));
        this.orders.set(this.prepareOrdersData(response.slice(1)));
        this.isLoading.set(false);
        this.loaderService.stop();
        this.loggerService.LogInfo('getAllOrders() Request Completed.');
        this.cdRef.detectChanges();
      })
      .catch((error: any) => {
        this.orders.set([]);
        this.totalRecords.set(0);
        this.isLoading.set(false);
        this.loaderService.stop();
        this.loggerService.LogError(error, 'getAllOrders()');
        this.cdRef.detectChanges();
      });
  }

  private prepareOrdersData(rows: any[]): OrdersDataModel[] {
    return (rows ?? []).map((order: any) => {
      const cust = order.customerDetails ?? order.customer_details ?? {};
      const grand = Number(order.grandTotal ?? order.totalAmountWithGst ?? 0);
      const isPaid = order.isPaymentDone === true || order.isPaymentDone === 1;
      const lineItems = order.lineItems ?? order.invoice_products ?? [];
      const itemCount = Array.isArray(lineItems) ? lineItems.length : Number(order.totalLineItems ?? 0);
      return {
        orderId: order.id,
        orderGuid: order.invoiceGuid,
        invoiceNumber: order.invoiceNumber,
        placeOfSupply: order.placeOfSupply,
        hsn: order.hsn,
        orderDate: order.createdAt,
        customerFullName: `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim() || '—',
        customerId: cust.customerId ?? cust.id ?? 0,
        customerGuid: cust.customerGuid ?? '',
        payments: order.payments ?? [],
        paymentStatus: isPaid ? PaymentStatus.DONE : PaymentStatus.PENDING,
        isPaymentDone: isPaid,
        remarks: order.remarks ?? null,
        totalAmountWithGst: grand,
        subTotalTaxable: order.subTotalTaxable,
        totalCgst: order.totalCgst,
        totalSgst: order.totalSgst,
        totalIgst: order.totalIgst,
        totalMakingCharge: order.totalMakingCharge,
        totalStoneCharge: order.totalStoneCharge,
        totalWastageCharge: order.totalWastageCharge,
        totalDiscount: order.totalDiscount,
        oldGoldCreditAmount: order.oldGoldCreditAmount,
        roundOffAmount: order.roundOffAmount,
        grandTotal: grand,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason,
        totalLineItems: itemCount,
      } as OrdersDataModel & { totalLineItems: number };
    });
  }

  formatMoney(value: number | string | null | undefined): string {
    const n = Number(value ?? 0);
    if (!Number.isFinite(n)) return this.moneyFormatter.format(0);
    return this.moneyFormatter.format(n);
  }

  statusOf(row: OrdersDataModel): 'paid' | 'unpaid' | 'cancelled' {
    if (row.cancelledAt) return 'cancelled';
    return row.isPaymentDone ? 'paid' : 'unpaid';
  }

  goToViewDetails(row: OrdersDataModel) {
    this.router.navigate([`/orders/view-order-details/${row.orderGuid}`]);
  }

  goToPrint(event: Event, row: OrdersDataModel) {
    event.stopPropagation();
    this.router.navigate([`/orders/print-invoice/${row.orderGuid}`]);
  }

  cancelOrder(event: Event, row: OrdersDataModel) {
    event.stopPropagation();
    if (row.cancelledAt) return;
    this.dialog.fire({
      title: 'Cancel this invoice?',
      html: `<span style="color: var(--color-fg-muted)">${row.invoiceNumber}</span><br>You will not be able to revert this.`,
      icon: 'warning',
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Yes, cancel it',
      cancelButtonText: 'Keep it',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.loggerService.LogInfo('cancelOrder() Request Started.');
      this.ordersService
        .cancelOrder(row.orderGuid)
        .then((data: any) => {
          this.getAllOrders();
          const message = Array.isArray(data) && data[0]?.message;
          if (!message) {
            this.toast.success('Invoice cancelled successfully.', 'Cancelled');
          } else {
            this.toast.error(message, 'Error');
            this.loggerService.LogError(message, 'cancelOrder()');
          }
        })
        .catch((error: any) => {
          this.toast.error(error?.toString?.() ?? 'Failed to cancel invoice', 'Error');
          this.loggerService.LogError(error, 'cancelOrder()');
        });
    });
  }
}
