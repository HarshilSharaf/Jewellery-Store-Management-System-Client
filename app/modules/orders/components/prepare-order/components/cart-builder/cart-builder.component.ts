import { CommonModule } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSearch,
  lucideTrash2,
  lucideLock,
  lucideLockOpen,
  lucideCircleAlert,
  lucidePlus,
  lucideRotateCcw,
} from '@ng-icons/lucide';

import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { AvailableProductsService } from '../../../../../inventory/components/available-products/services/available-products.service';
import { CartService } from '../../../../../../shared/services/cart.service';
import { MetalRatesService } from '../../../../../../shared/services/MetalRates/metal-rates.service';
import { PuritiesService } from '../../../../../../shared/services/Purities/purities.service';
import { ShopSettingsService } from '../../../../../../shared/services/ShopSettings/shop-settings.service';
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
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../../../models/invoice-product-data-model';
import { ProductDataModel } from '../../../../models/product-data-model';

@Component({
  selector: 'app-cart-builder',
  templateUrl: './cart-builder.component.html',
  styleUrls: ['./cart-builder.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideSearch,
      lucideTrash2,
      lucideLock,
      lucideLockOpen,
      lucideCircleAlert,
      lucidePlus,
      lucideRotateCcw,
    }),
  ],
})
export class CartBuilderComponent implements OnInit {

  @Input() selectedCustomer: CustomerDetails | null = null;

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  readonly search = new FormControl<string>('', { nonNullable: true });

  readonly loadingProducts = signal(false);
  readonly loadingRates = signal(true);
  private allProducts: ProductDataModel[] = [];
  readonly picks = signal<ProductDataModel[]>([]);
  readonly pickerOpen = signal(false);
  readonly pickerIndex = signal<number>(-1);

  readonly rateSnapshot = signal<Record<string, number>>({});
  readonly metalRates = signal<MetalRateRow[]>([]);
  readonly rateLockedAt = signal<Date | null>(null);
  readonly shopSettings = signal<ShopSettings | null>(null);
  private taxSlabsByHsn: Record<string, TaxSlab> = {};

  private readonly destroyRef = inject(DestroyRef);

  readonly cartLines = signal<InvoiceProductDataModel[]>([]);
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

  readonly primaryPurity = computed<string>(() => {
    const line = this.cartLines()[0];
    return line?.purityCode ?? '916';
  });

  readonly puritiesInCart = computed<string[]>(() => {
    const set = new Set<string>();
    for (const l of this.cartLines()) if (l.purityCode) set.add(l.purityCode);
    return set.size ? Array.from(set) : ['916'];
  });

  private readonly moneyFmt = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  private readonly moneyIntFmt = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  });

  constructor(
    private productsService: AvailableProductsService,
    private cartService: CartService,
    private metalRatesService: MetalRatesService,
    private puritiesService: PuritiesService,
    private shopSettingsService: ShopSettingsService,
    private fsService: FileSystemService,
    private utilityService: UtilityService,
    private loggerService: LoggerService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Load existing cart from CartService (persisted in localStorage).
    const existing = this.cartService.getProducts()();
    if (Array.isArray(existing)) {
      this.cartLines.set(existing.map((p) => this.toCartLine(p)));
    }

    // Load rates, settings, tax slabs, and products in parallel.
    try {
      const [rates, settings, taxSlabs, productsRaw] = await Promise.all([
        this.metalRatesService.getCurrent(),
        this.shopSettingsService.get(),
        this.puritiesService.getTaxSlabs(),
        this.productsService.getAllProductsData(500, 1, '', 0),
      ]);

      this.metalRates.set(rates ?? []);
      this.shopSettings.set(settings);
      this.rateSnapshot.set(this.metalRatesService.buildSnapshot(rates ?? []));
      this.rateLockedAt.set(new Date());

      this.taxSlabsByHsn = {};
      for (const slab of taxSlabs ?? []) {
        this.taxSlabsByHsn[slab.hsnCode] = {
          hsnCode: slab.hsnCode,
          cgstRate: Number(slab.cgstRate),
          sgstRate: Number(slab.sgstRate),
          igstRate: Number(slab.igstRate),
        };
      }

      const products = Array.isArray(productsRaw) ? (productsRaw as ProductDataModel[]) : [];
      for (const p of products) {
        if (p.imagePath) {
          p.image = this.utilityService.getFilePath(
            this.fsService.productImagesDir + '\\' + p.imagePath,
          );
        }
      }
      this.allProducts = products;

      // Ensure existing lines have a rate if they were missing one.
      this.cartLines.update((lines) =>
        lines.map((l) => (l.ratePerGram ? l : { ...l, ratePerGram: this.rateFor(l.purityCode) })),
      );
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.ngOnInit');
    } finally {
      this.loadingRates.set(false);
      this.recalcAll();
    }

    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.updatePicks(val ?? '');
    });
  }

  private updatePicks(text: string): void {
    const term = text.trim().toLowerCase();
    if (!term) {
      this.picks.set([]);
      this.pickerOpen.set(false);
      this.pickerIndex.set(-1);
      return;
    }
    const results = this.allProducts
      .filter((p) => {
        if (p.isSold === true || p.isSold === 1) return false;
        if (this.cartLines().some((l) => l.productGuid === p.productGuid)) return false;
        return (
          (p.sku ?? '').toLowerCase().includes(term) ||
          (p.huid ?? '').toLowerCase().includes(term) ||
          (p.productDescription ?? '').toLowerCase().includes(term) ||
          (p.masterCategory ?? '').toLowerCase().includes(term) ||
          (p.subCategory ?? '').toLowerCase().includes(term)
        );
      })
      .slice(0, 6);
    this.picks.set(results);
    this.pickerOpen.set(results.length > 0);
    this.pickerIndex.set(results.length ? 0 : -1);
  }

  focusSearch(): void {
    this.searchInput?.nativeElement.focus();
    this.searchInput?.nativeElement.select();
  }

  onSearchKeydown(event: KeyboardEvent): void {
    const items = this.picks();
    if (event.key === 'ArrowDown') {
      if (items.length === 0) return;
      event.preventDefault();
      this.pickerIndex.set((this.pickerIndex() + 1) % items.length);
    } else if (event.key === 'ArrowUp') {
      if (items.length === 0) return;
      event.preventDefault();
      this.pickerIndex.set((this.pickerIndex() - 1 + items.length) % items.length);
    } else if (event.key === 'Enter') {
      if (items.length === 0) return;
      event.preventDefault();
      const target = items[this.pickerIndex() >= 0 ? this.pickerIndex() : 0];
      this.addProduct(target);
    } else if (event.key === 'Escape') {
      this.pickerOpen.set(false);
    }
  }

  addProduct(product: ProductDataModel): void {
    if (!product) return;
    if (this.cartLines().some((l) => l.productGuid === product.productGuid)) return;

    const line = this.toCartLine(product);
    if (!line.ratePerGram) line.ratePerGram = this.rateFor(line.purityCode);
    const next = [...this.cartLines(), line];
    this.cartLines.set(next);
    this.cartService.setProduct(line);
    this.recalcAll();

    // Clear search + refocus
    this.search.setValue('');
    this.picks.set([]);
    this.pickerOpen.set(false);
    setTimeout(() => this.focusSearch(), 0);
  }

  removeLine(line: InvoiceProductDataModel): void {
    this.cartLines.set(this.cartLines().filter((l) => l.productGuid !== line.productGuid));
    this.cartService.removeCartItem(line);
    this.recalcAll();
  }

  private toCartLine(product: any): InvoiceProductDataModel {
    const purityCode = product.purityCode ?? '916';
    const makingMode: MakingMode = (product.makingMode as MakingMode) ?? 'perGram';
    return {
      ...product,
      lineType: 'product',
      purityCode,
      purityLabel: product.purityLabel,
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

  onLineFieldChange(line: InvoiceProductDataModel, field: string, value: any): void {
    const numeric = Number(value);
    const updated = { ...line } as any;
    switch (field) {
      case 'netWeight':       updated.netWeight = numeric; break;
      case 'ratePerGram':     updated.ratePerGram = numeric; break;
      case 'makingMode':      updated.makingMode = value as MakingMode; break;
      case 'makingValue':     updated.makingValue = numeric; break;
      case 'wastagePercent':  updated.wastagePercent = numeric; break;
      case 'stoneCharges':    updated.stoneCharges = numeric; break;
      case 'discountAmount':  updated.discountAmount = numeric; break;
    }
    const idx = this.cartLines().findIndex((l) => l.productGuid === line.productGuid);
    if (idx === -1) return;
    const next = [...this.cartLines()];
    next[idx] = updated;
    this.cartLines.set(next);
    this.recalcAll();
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
    const placeOfSupplyStateCode = this.selectedCustomer?.stateCode ?? shopStateCode;
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

    const computed = computeCartTotals(inputs, {
      shopStateCode,
      invoicePlaceOfSupplyStateCode: placeOfSupplyStateCode,
      taxSlabsByHsn: this.taxSlabsByHsn,
      oldGoldCreditAmount: 0,
      roundOff: true,
    });

    this.totals.set(computed);

    // Mirror computed totals back onto our line view models.
    this.cartLines.update((lines) =>
      lines.map((l, idx) => {
        const c: CartLineComputed | undefined = computed.lines[idx];
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

  async relockRate(): Promise<void> {
    this.loadingRates.set(true);
    try {
      const rates = await this.metalRatesService.getCurrent();
      this.metalRates.set(rates ?? []);
      this.rateSnapshot.set(this.metalRatesService.buildSnapshot(rates ?? []));
      this.rateLockedAt.set(new Date());
      // Refresh per-line rates that were locked to old snapshot only if user opts in — we auto-refresh:
      this.cartLines.update((lines) =>
        lines.map((l) => ({ ...l, ratePerGram: this.rateFor(l.purityCode) })),
      );
      this.recalcAll();
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.relockRate');
    } finally {
      this.loadingRates.set(false);
    }
  }

  isInterState(): boolean {
    const shop = this.shopSettings()?.stateCode;
    const cust = this.selectedCustomer?.stateCode;
    if (!shop || !cust) return false;
    return String(shop).trim() !== String(cust).trim();
  }

  money(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyFmt.format(Number.isFinite(n) ? n : 0);
  }

  moneyInt(v: any): string {
    const n = Number(v ?? 0);
    return this.moneyIntFmt.format(Number.isFinite(n) ? n : 0);
  }

  ratePillLabel(purityCode: string): string {
    const row = this.metalRates().find((r) => r.purityCode === purityCode);
    return row?.purityLabel ?? purityCode;
  }

  rateOf(purityCode: string): number {
    return this.rateFor(purityCode);
  }

  timeLabel(): string {
    const t = this.rateLockedAt();
    if (!t) return '—';
    const hh = String(t.getHours()).padStart(2, '0');
    const mm = String(t.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  @HostListener('document:keydown', ['$event'])
  handleGlobalKeys(event: KeyboardEvent): void {
    if (event.key === '/' && event.target instanceof HTMLElement) {
      const tag = event.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      this.focusSearch();
    } else if (event.altKey && (event.key === 'd' || event.key === 'D')) {
      event.preventDefault();
      this.focusLastLineDiscount();
    }
  }

  private focusLastLineDiscount(): void {
    const lines = this.cartLines();
    if (lines.length === 0) return;
    const last = lines[lines.length - 1];
    const el = document.querySelector<HTMLInputElement>(
      `input[data-discount-key="${last.productGuid}"]`,
    );
    el?.focus();
    el?.select();
  }
}
