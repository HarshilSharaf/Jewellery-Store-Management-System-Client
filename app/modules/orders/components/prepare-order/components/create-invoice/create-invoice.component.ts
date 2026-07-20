import { DecimalPipe, CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import Swal from 'sweetalert2';

import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../../../models/invoice-product-data-model';
import { ProductDataModel } from '../../../../models/product-data-model';
import { OrderService } from '../../../../services/order.service';
import { CartService } from '../../../../../../shared/services/cart.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';

import { MetalRatesService } from '../../../../../../shared/services/MetalRates/metal-rates.service';
import { ShopSettingsService } from '../../../../../../shared/services/ShopSettings/shop-settings.service';
import { PuritiesService } from '../../../../../../shared/services/Purities/purities.service';
import { computeCartTotals } from '../../../../../../shared/services/Orders/cart-totals';
import { CartLineComputed, CartLineInput, CartTotals, MakingMode, TaxSlab } from '../../../../../../interfaces/Shared/cart';
import { MetalRateRow } from '../../../../../../interfaces/Shared/metal-rate';
import { ShopSettings } from '../../../../../../interfaces/Shared/shop-settings';
import { SaveOrderPayload } from '../../../../../../interfaces/Orders/orders-service-interface';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSave } from '@ng-icons/lucide';

@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideSave })],
  providers: [DecimalPipe]
})
export class CreateInvoiceComponent implements OnInit {

  _selectedCustomersInfo!: CustomerDetails;
  _selectedProductsData: InvoiceProductDataModel[] = [];

  currentDate: Date = new Date();
  paymentMethod = 'cash';
  paymentRefNumber = '';
  amountPaid = 0;

  rateSnapshot: Record<string, number> = {};
  ratesLoaded = false;
  metalRates: MetalRateRow[] = [];
  shopSettings: ShopSettings | null = null;
  taxSlabsByHsn: Record<string, TaxSlab> = {};

  totals: CartTotals = {
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
  };

  @Input() set selectedProductsData(productsData: { lengthOfData: number, selectedProducts: ProductDataModel[] }) {
    const clone = structuredClone(productsData);
    this._selectedProductsData = clone.selectedProducts.map((p) => this.toCartLine(p));
    this.recalcAll();
  }

  @Input() set selectedCustomersInfo(customerInfo: any) {
    this._selectedCustomersInfo = customerInfo;
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
    private puritiesService: PuritiesService
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const [rates, settings, taxSlabs] = await Promise.all([
        this.metalRatesService.getCurrent(),
        this.shopSettingsService.get(),
        this.puritiesService.getTaxSlabs(),
      ]);
      this.metalRates = rates ?? [];
      this.shopSettings = settings;
      this.rateSnapshot = this.metalRatesService.buildSnapshot(this.metalRates);
      this.taxSlabsByHsn = {};
      for (const slab of taxSlabs ?? []) {
        this.taxSlabsByHsn[slab.hsnCode] = {
          hsnCode: slab.hsnCode,
          cgstRate: Number(slab.cgstRate),
          sgstRate: Number(slab.sgstRate),
          igstRate: Number(slab.igstRate),
        };
      }
      this.ratesLoaded = true;
      this._selectedProductsData.forEach((line) => {
        if (!line.ratePerGram) {
          line.ratePerGram = this.rateFor(line.purityCode);
        }
      });
      this.recalcAll();
    } catch (error) {
      this.ratesLoaded = true;
      this.loggerService.LogError(error, 'CreateInvoice.ngOnInit');
    }
  }

  private toCartLine(product: ProductDataModel | any): InvoiceProductDataModel {
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
      discountAmount: 0,
      tagPrice: Number(product.tagPrice ?? 0),
    };
  }

  private rateFor(purityCode: string): number {
    return Number(this.rateSnapshot[purityCode] ?? 0);
  }

  onLineFieldChange(product: InvoiceProductDataModel, field: string, value: any) {
    const numeric = Number(value);
    switch (field) {
      case 'ratePerGram':    product.ratePerGram = numeric; break;
      case 'netWeight':      product.netWeight = numeric; break;
      case 'makingMode':     product.makingMode = value as MakingMode; break;
      case 'makingValue':    product.makingValue = numeric; break;
      case 'wastagePercent': product.wastagePercent = numeric; break;
      case 'stoneCharges':   product.stoneCharges = numeric; break;
      case 'discountAmount': product.discountAmount = numeric; break;
    }
    this.recalcAll();
  }

  recalcAll() {
    if (!this._selectedProductsData?.length) {
      this.totals = { ...this.totals, lines: [], subTotalTaxable: 0, totalCgst: 0, totalSgst: 0, totalIgst: 0, totalMakingCharge: 0, totalStoneCharge: 0, totalWastageCharge: 0, totalDiscount: 0, grandTotal: 0, oldGoldCreditAmount: 0, roundOffAmount: 0 };
      return;
    }
    const shopStateCode = this.shopSettings?.stateCode ?? '27';
    const placeOfSupplyStateCode = this._selectedCustomersInfo?.stateCode ?? shopStateCode;
    const lines: CartLineInput[] = this._selectedProductsData.map((p) => ({
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

    this.totals = computeCartTotals(lines, {
      shopStateCode,
      invoicePlaceOfSupplyStateCode: placeOfSupplyStateCode,
      taxSlabsByHsn: this.taxSlabsByHsn,
      oldGoldCreditAmount: 0,
      roundOff: true,
    });

    this.totals.lines.forEach((computed: CartLineComputed, idx: number) => {
      const target = this._selectedProductsData[idx];
      if (!target) { return; }
      target.metalValue = computed.metalValue;
      target.makingCharge = computed.makingCharge;
      target.wastageCharge = computed.wastageCharge;
      target.stoneCharge = computed.stoneCharge;
      target.discountAmount = computed.discountAmount;
      target.taxableAmount = computed.taxableAmount;
      target.cgst = computed.cgst;
      target.sgst = computed.sgst;
      target.igst = computed.igst;
      target.lineTotal = computed.lineTotal;
    });
  }

  saveOrder() {
    this.loggerService.LogInfo('saveOrder() Request Started.');
    this.loaderService.start();

    const payload: SaveOrderPayload = {
      customerId: this._selectedCustomersInfo.id,
      placeOfSupply: this._selectedCustomersInfo.state ?? this.shopSettings?.state ?? '',
      hsn: '7113',
      rateSnapshot: this.rateSnapshot,
      subTotalTaxable: this.totals.subTotalTaxable,
      totalCgst: this.totals.totalCgst,
      totalSgst: this.totals.totalSgst,
      totalIgst: this.totals.totalIgst,
      totalDiscount: this.totals.totalDiscount,
      totalMakingCharge: this.totals.totalMakingCharge,
      totalStoneCharge: this.totals.totalStoneCharge,
      totalWastageCharge: this.totals.totalWastageCharge,
      oldGoldCreditAmount: this.totals.oldGoldCreditAmount,
      roundOffAmount: this.totals.roundOffAmount,
      grandTotal: this.totals.grandTotal,
      remarks: null,
      amountPaid: Number(this.amountPaid) || 0,
      paymentMethod: this.paymentMethod,
      paymentRefNumber: this.paymentRefNumber || null,
      lineItems: this.totals.lines,
      oldGoldReceipts: null,
    };

    this.orderService.saveOrder(payload)
      .then((response: any) => {
        this.loaderService.stop();
        const flat = Array.isArray(response) ? response.flat() : response;
        const hasError = Array.isArray(flat) && flat.some((r: any) => r && typeof r === 'object' && r.message?.startsWith?.('Error:'));
        if (!hasError) {
          this.cartService.emptyCart();
          Swal.fire({
            title: 'Invoice saved',
            html: 'Redirecting to orders...',
            timer: 2500,
            timerProgressBar: true,
            didOpen: () => Swal.showLoading(),
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              this.loggerService.LogInfo('saveOrder() Request Completed.');
              this.router.navigate(['../'], { relativeTo: this.route });
            }
          });
        } else {
          const errMsg = flat.find((r: any) => r?.message?.startsWith?.('Error:'))?.message ?? 'Failed to save order';
          this.loggerService.LogError(errMsg, 'saveOrder()');
          Swal.fire('Error', errMsg, 'error');
        }
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'saveOrder()');
        this.loaderService.stop();
        Swal.fire('Error', error ?? 'Failed to save order', 'error');
      });
  }
}
