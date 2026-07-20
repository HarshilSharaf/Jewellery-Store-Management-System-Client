import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSave, lucideCheck } from '@ng-icons/lucide';
import Swal from 'sweetalert2';

import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../../../models/invoice-product-data-model';
import { ProductDataModel } from '../../../../models/product-data-model';
import { OrderService } from '../../../../services/order.service';
import { CartService } from '../../../../../../shared/services/cart.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../../../Backend/Shared/store.service';

import { MetalRatesService } from '../../../../../../shared/services/MetalRates/metal-rates.service';
import { ShopSettingsService } from '../../../../../../shared/services/ShopSettings/shop-settings.service';
import { PuritiesService } from '../../../../../../shared/services/Purities/purities.service';
import { computeCartTotals } from '../../../../../../shared/services/Orders/cart-totals';
import {
  CartLineComputed,
  CartLineInput,
  CartTotals,
  MakingMode,
  TaxSlab,
} from '../../../../../../interfaces/Shared/cart';
import { MetalRateRow } from '../../../../../../interfaces/Shared/metal-rate';
import { ShopSettings } from '../../../../../../interfaces/Shared/shop-settings';
import { SaveOrderPayload } from '../../../../../../interfaces/Orders/orders-service-interface';
import { numberToIndianRupees } from '../../../../../../shared/utils/amount-in-words';

@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideSave, lucideCheck })],
})
export class CreateInvoiceComponent implements OnInit {

  readonly customer = signal<CustomerDetails | null>(null);
  readonly cartLines = signal<InvoiceProductDataModel[]>([]);

  readonly rateSnapshot = signal<Record<string, number>>({});
  readonly metalRates = signal<MetalRateRow[]>([]);
  readonly shopSettings = signal<ShopSettings | null>(null);
  private taxSlabsByHsn: Record<string, TaxSlab> = {};

  readonly totals = signal<CartTotals>({
    lines: [],
    subTotalTaxable: 0,
    totalMakingCharge: 0,
    totalStoneCharge: 0,
    totalWastageCharge: 0,
    totalDiscount: 0,
    totalCgst: 0,
    totalSgst: 0,
    totalIgst: 0,
    oldGoldCreditAmount: 0,
    roundOffAmount: 0,
    grandTotal: 0,
  });

  readonly saving = signal(false);
  readonly today = new Date();

  readonly isInterState = computed<boolean>(() => {
    const shop = this.shopSettings()?.stateCode;
    const cust = this.customer()?.stateCode;
    if (!shop || !cust) return false;
    return String(shop).trim() !== String(cust).trim();
  });

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  private readonly storeService = inject(StoreService);
  private currentUserId: number | null = null;
  readonly oldGoldCreditAmount = computed<number>(() => Number(this.cartService.oldGoldState()?.creditAmount ?? 0));
  readonly oldGoldReceiptGuid  = computed<string | null>(() => this.cartService.oldGoldState()?.receiptGuid ?? null);

  @Input() set selectedProductsData(data: { lengthOfData: number; selectedProducts: ProductDataModel[] } | null) {
    if (!data) return;
    const lines = (data.selectedProducts ?? []).map((p) => this.toCartLine(p));
    this.cartLines.set(lines);
    this.recalcAll();
  }

  @Input() set selectedCustomersInfo(customerInfo: CustomerDetails | null) {
    this.customer.set(customerInfo);
    this.recalcAll();
  }

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private metalRatesService: MetalRatesService,
    private shopSettingsService: ShopSettingsService,
    private puritiesService: PuritiesService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const authData: any = await this.storeService.get('authData');
      this.currentUserId = Number(authData?.uid ?? null) || null;
    } catch { /* ignore */ }
    try {
      const [rates, settings, taxSlabs] = await Promise.all([
        this.metalRatesService.getCurrent(),
        this.shopSettingsService.get(),
        this.puritiesService.getTaxSlabs(),
      ]);
      this.metalRates.set(rates ?? []);
      this.shopSettings.set(settings);
      this.rateSnapshot.set(this.metalRatesService.buildSnapshot(rates ?? []));
      this.taxSlabsByHsn = {};
      for (const slab of taxSlabs ?? []) {
        this.taxSlabsByHsn[slab.hsnCode] = {
          hsnCode: slab.hsnCode,
          cgstRate: Number(slab.cgstRate),
          sgstRate: Number(slab.sgstRate),
          igstRate: Number(slab.igstRate),
        };
      }
      this.cartLines.update((lines) =>
        lines.map((l) => (l.ratePerGram ? l : { ...l, ratePerGram: this.rateFor(l.purityCode) })),
      );
      this.recalcAll();
    } catch (err) {
      this.loggerService.LogError(err, 'CreateInvoice.ngOnInit');
    }
  }

  private toCartLine(product: any): InvoiceProductDataModel {
    const purityCode = product.purityCode ?? '916';
    const makingMode: MakingMode = (product.makingMode as MakingMode) ?? 'perGram';
    return {
      ...product,
      lineType: 'product',
      purityCode,
      hsnCode: product.hsnCode ?? '7113',
      grossWeight: Number(product.grossWeight ?? 0),
      netWeight: Number(product.netWeight ?? 0),
      stoneWeight: Number(product.stoneWeight ?? 0),
      stoneCharges: Number(product.stoneCharges ?? 0),
      makingMode,
      makingValue: Number(product.makingValue ?? 0),
      wastagePercent: Number(product.wastagePercent ?? 0),
      ratePerGram: Number(product.ratePerGram ?? this.rateFor(purityCode)),
      discountAmount: Number(product.discountAmount ?? 0),
      tagPrice: Number(product.tagPrice ?? 0),
    } as InvoiceProductDataModel;
  }

  private rateFor(purityCode: string): number {
    return Number(this.rateSnapshot()[purityCode] ?? 0);
  }

  recalcAll(): void {
    if (this.cartLines().length === 0) {
      this.totals.set({
        lines: [],
        subTotalTaxable: 0,
        totalMakingCharge: 0,
        totalStoneCharge: 0,
        totalWastageCharge: 0,
        totalDiscount: 0,
        totalCgst: 0,
        totalSgst: 0,
        totalIgst: 0,
        oldGoldCreditAmount: 0,
        roundOffAmount: 0,
        grandTotal: 0,
      });
      return;
    }
    const shopStateCode = this.shopSettings()?.stateCode ?? '27';
    const placeOfSupplyStateCode = this.customer()?.stateCode ?? shopStateCode;
    const inputs: CartLineInput[] = this.cartLines().map((p) => ({
      productId: p.id,
      lineType: p.lineType ?? 'product',
      description: p.productDescription ?? null,
      hsnCode: p.hsnCode ?? '7113',
      purityCode: p.purityCode,
      grossWeight: Number(p.grossWeight) || 0,
      netWeight: Number(p.netWeight) || 0,
      stoneWeight: Number(p.stoneWeight) || 0,
      ratePerGram: Number(p.ratePerGram) || 0,
      makingMode: p.makingMode ?? 'perGram',
      makingValue: Number(p.makingValue) || 0,
      wastagePercent: Number(p.wastagePercent) || 0,
      stoneCharges: Number(p.stoneCharges) || 0,
      discountAmount: Number(p.discountAmount) || 0,
    }));

    const totals = computeCartTotals(inputs, {
      shopStateCode,
      invoicePlaceOfSupplyStateCode: placeOfSupplyStateCode,
      taxSlabsByHsn: this.taxSlabsByHsn,
      oldGoldCreditAmount: this.oldGoldCreditAmount(),
      roundOff: true,
    });

    this.totals.set(totals);

    this.cartLines.update((lines) =>
      lines.map((l, idx) => {
        const c: CartLineComputed | undefined = totals.lines[idx];
        if (!c) return l;
        return {
          ...l,
          metalValue: c.metalValue,
          makingCharge: c.makingCharge,
          wastageCharge: c.wastageCharge,
          stoneCharge: c.stoneCharge,
          discountAmount: c.discountAmount,
          taxableAmount: c.taxableAmount,
          cgst: c.cgst,
          sgst: c.sgst,
          igst: c.igst,
          lineTotal: c.lineTotal,
        };
      }),
    );
  }

  saveOrder(): void {
    const cust = this.customer();
    if (!cust || this.cartLines().length === 0 || this.totals().grandTotal <= 0 || this.saving()) return;

    this.saving.set(true);
    this.loggerService.LogInfo('saveOrder() Request Started.');
    this.loaderService.start();

    const payload: SaveOrderPayload = {
      customerId: cust.id,
      placeOfSupply: cust.state ?? this.shopSettings()?.state ?? '',
      hsn: '7113',
      rateSnapshot: this.rateSnapshot(),
      subTotalTaxable: this.totals().subTotalTaxable,
      totalCgst: this.totals().totalCgst,
      totalSgst: this.totals().totalSgst,
      totalIgst: this.totals().totalIgst,
      totalDiscount: this.totals().totalDiscount,
      totalMakingCharge: this.totals().totalMakingCharge,
      totalStoneCharge: this.totals().totalStoneCharge,
      totalWastageCharge: this.totals().totalWastageCharge,
      oldGoldCreditAmount: this.totals().oldGoldCreditAmount,
      roundOffAmount: this.totals().roundOffAmount,
      grandTotal: this.totals().grandTotal,
      remarks: null,
      amountPaid: 0,
      paymentMethod: 'cash',
      paymentRefNumber: null,
      lineItems: this.totals().lines,
      oldGoldReceipts: null,
      oldGoldReceiptGuid: this.oldGoldReceiptGuid(),
      savingSchemeGuid: this.cartService.schemeState()?.schemeGuid ?? null,
      actorUserId: this.currentUserId,
    };

    this.orderService
      .saveOrder(payload)
      .then((response: any) => {
        this.loaderService.stop();
        this.saving.set(false);
        const flat = Array.isArray(response) ? response.flat() : response;
        const hasError =
          Array.isArray(flat) && flat.some((r: any) => r && typeof r === 'object' && r.message?.startsWith?.('Error:'));
        if (!hasError) {
          this.cartService.emptyCart();
          Swal.fire({
            title: 'Invoice saved',
            html: 'Redirecting to Books…',
            timer: 1800,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading(),
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              this.loggerService.LogInfo('saveOrder() Request Completed.');
              this.router.navigate(['/orders']);
            }
          });
        } else {
          const errMsg = flat.find((r: any) => r?.message?.startsWith?.('Error:'))?.message ?? 'Failed to save invoice';
          this.loggerService.LogError(errMsg, 'saveOrder()');
          Swal.fire('Error', errMsg, 'error');
        }
      })
      .catch((error: any) => {
        this.saving.set(false);
        this.loaderService.stop();
        this.loggerService.LogError(error, 'saveOrder()');
        Swal.fire('Error', typeof error === 'string' ? error : 'Failed to save invoice', 'error');
      });
  }

  money(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyFmt.format(Number.isFinite(n) ? n : 0);
  }

  amountInWords(): string {
    return numberToIndianRupees(this.totals().grandTotal);
  }
}
