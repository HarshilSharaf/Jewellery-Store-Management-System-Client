import { CommonModule } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  Input,
  OnDestroy,
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
  lucideScale,
  lucideWeight,
  lucideChevronDown,
  lucideChevronUp,
  lucideX,
  lucidePiggyBank,
} from '@ng-icons/lucide';
import { AppDialogService } from '../../../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../../../shared/services/AppToast/app-toast.service';

import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../../../Backend/Shared/store.service';
import { AvailableProductsService } from '../../../../../inventory/components/available-products/services/available-products.service';
import { CartService, CartOldGoldState, CartSchemeState } from '../../../../../../shared/services/cart.service';
import { MetalRatesService } from '../../../../../../shared/services/MetalRates/metal-rates.service';
import { PuritiesService } from '../../../../../../shared/services/Purities/purities.service';
import { ShopSettingsService } from '../../../../../../shared/services/ShopSettings/shop-settings.service';
import { OldGoldService } from '../../../../../../shared/services/OldGold/old-gold.service';
import { SavingSchemesService } from '../../../../../../shared/services/SavingSchemes/saving-schemes.service';
import { ScannerService } from '../../../../../../shared/services/Hardware/scanner.service';
import { ScaleService } from '../../../../../../shared/services/Hardware/scale.service';
import { SavingScheme } from '../../../../../../interfaces/SavingSchemes/saving-scheme';
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
import { Purity } from '../../../../../../interfaces/Shared/purity';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../../../models/invoice-product-data-model';
import { ProductDataModel } from '../../../../models/product-data-model';

const DEFAULT_OLD_GOLD_DEDUCTION_PERCENT = 5;
const SCAN_ENABLED_STORAGE_KEY = 'jsms.scanner.cart.enabled';

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
      lucideScale,
      lucideWeight,
      lucideChevronDown,
      lucideChevronUp,
      lucideX,
      lucidePiggyBank,
    }),
  ],
})
export class CartBuilderComponent implements OnInit, OnDestroy {

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
  readonly purities = signal<Purity[]>([]);
  private taxSlabsByHsn: Record<string, TaxSlab> = {};

  private readonly destroyRef = inject(DestroyRef);
  private readonly scannerService = inject(ScannerService);
  readonly scaleService = inject(ScaleService);
  private readonly oldGoldService = inject(OldGoldService);
  private readonly storeService = inject(StoreService);
  private readonly savingSchemesService = inject(SavingSchemesService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);

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

  // Old-gold panel state
  readonly oldGoldOpen = signal(false);
  readonly oldGoldSaving = signal(false);
  readonly oldGoldGrossWeight = signal<number>(0);
  readonly oldGoldPurityCode = signal<string>('916');
  readonly oldGoldFineness = signal<number | null>(null);
  readonly oldGoldRatePerGram = signal<number>(0);
  readonly oldGoldDeductionPercent = signal<number>(DEFAULT_OLD_GOLD_DEDUCTION_PERCENT);
  readonly oldGoldRemarks = signal<string>('');
  readonly oldGoldReceiptGuid = signal<string | null>(null);

  readonly oldGoldCreditAmount = computed<number>(() => {
    const gross = Number(this.oldGoldGrossWeight()) || 0;
    const fineness = Number(this.oldGoldFineness() ?? this.finenessOf(this.oldGoldPurityCode())) || 0;
    const rate = Number(this.oldGoldRatePerGram()) || 0;
    const deduction = Number(this.oldGoldDeductionPercent()) || 0;
    if (gross <= 0 || fineness <= 0 || rate <= 0) { return 0; }
    return Math.round(gross * (fineness / 1000) * rate * (1 - deduction / 100) * 100) / 100;
  });

  // Saving-scheme redemption state (Workstream M).
  readonly appliedScheme = signal<CartSchemeState | null>(null);
  readonly schemePickerOpen = signal(false);
  readonly eligibleSchemes = signal<SavingScheme[]>([]);

  private currentUserId: number | null = null;

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
    // Read stored scanner-on-cart preference (default: on).
    const scannerPref = localStorage.getItem(SCAN_ENABLED_STORAGE_KEY);
    if (scannerPref === '0') { this.scannerService.disable(); }
    this.scannerService.start();
    this.scannerService.scan$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((code) => this.handleScan(code));

    // Cache the currently-logged-in user id for actorUserId + receipt writes.
    try {
      const authData: any = await this.storeService.get('authData');
      this.currentUserId = Number(authData?.uid ?? null) || null;
    } catch { /* ignore */ }

    // Restore any saved old-gold state that was persisted on the cart.
    const savedOldGold = this.cartService.oldGoldState();
    if (savedOldGold) {
      this.oldGoldReceiptGuid.set(savedOldGold.receiptGuid);
      this.oldGoldGrossWeight.set(savedOldGold.grossWeight);
      this.oldGoldPurityCode.set(savedOldGold.testedPurityCode ?? '916');
      this.oldGoldFineness.set(savedOldGold.testedPurityPercent ?? null);
      this.oldGoldRatePerGram.set(savedOldGold.ratePerGram);
      this.oldGoldDeductionPercent.set(savedOldGold.deductionPercent);
      this.oldGoldRemarks.set(savedOldGold.remarks ?? '');
    }

    // Restore any saved scheme redemption on the cart.
    const savedScheme = this.cartService.schemeState();
    if (savedScheme) {
      this.appliedScheme.set(savedScheme);
    }

    // Load existing cart from CartService (persisted in localStorage).
    const existing = this.cartService.getProducts()();
    if (Array.isArray(existing)) {
      this.cartLines.set(existing.map((p) => this.toCartLine(p)));
    }

    // Preload eligible schemes for the current customer (if any).
    if (this.selectedCustomer?.customerGuid) {
      this.refreshEligibleSchemes();
    }

    // Load rates, settings, tax slabs, purities, and products in parallel.
    try {
      const [rates, settings, taxSlabs, purities, productsRaw] = await Promise.all([
        this.metalRatesService.getCurrent(),
        this.shopSettingsService.get(),
        this.puritiesService.getTaxSlabs(),
        this.puritiesService.getPurities(),
        this.productsService.getAllProductsData(500, 1, '', 0),
      ]);

      this.metalRates.set(rates ?? []);
      this.shopSettings.set(settings);
      this.rateSnapshot.set(this.metalRatesService.buildSnapshot(rates ?? []));
      this.rateLockedAt.set(new Date());
      this.purities.set(Array.isArray(purities) ? purities : []);

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
          p.image = await this.fsService.getProductImageInBase64(p.imagePath);
        }
      }
      this.allProducts = products;

      // Prime the old-gold rate from the current metal-rate snapshot.
      if (!savedOldGold) {
        this.oldGoldRatePerGram.set(this.rateFor(this.oldGoldPurityCode()));
      }

      // Ensure existing lines have a rate if they were missing one.
      this.cartLines.update((lines) =>
        lines.map((l) => (l.ratePerGram ? l : { ...l, ratePerGram: this.rateFor(l.purityCode) })),
      );
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.ngOnInit');
    } finally {
      this.loadingRates.set(false);
      this.recalcAll();
      this.cdRef.detectChanges();
    }

    this.search.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((val) => {
      this.updatePicks(val ?? '');
    });
  }

  ngOnDestroy(): void {
    // The scanner is a singleton; leave it running for other consumers, but
    // ensure the cart-builder's subscription is torn down (handled by
    // takeUntilDestroyed).
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

  private finenessOf(purityCode: string): number {
    const row = this.purities().find((p) => p.code === purityCode);
    return Number(row?.fineness ?? 0);
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
        oldGoldCreditAmount: this.oldGoldCreditAmount(),
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
      oldGoldCreditAmount: this.oldGoldCreditAmount(),
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
      this.oldGoldRatePerGram.set(this.rateFor(this.oldGoldPurityCode()));
      this.recalcAll();
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.relockRate');
    } finally {
      this.loadingRates.set(false);
      this.cdRef.detectChanges();
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
    } else if (event.altKey && (event.key === 'w' || event.key === 'W')) {
      // Alt+W: capture weight from scale into the currently-focused net-weight
      // input, or trigger the HID keyboard-wedge pattern by focusing the
      // first line's netWeight input if nothing weight-relevant has focus.
      this.handleAltWeight(event);
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

  // --- Scanner integration ------------------------------------------------

  private handleScan(code: string): void {
    const term = (code ?? '').trim();
    if (!term) { return; }
    const upper = term.toUpperCase();
    const match = this.allProducts.find((p) => {
      if (p.isSold === true || p.isSold === 1) return false;
      const sku = (p.sku ?? '').toUpperCase();
      const huid = (p.huid ?? '').toUpperCase();
      return sku === upper || huid === upper;
    });
    if (!match) {
      this.toast.warning(`No product found for ${term}`, undefined, { timer: 2400 });
      return;
    }
    if (this.cartLines().some((l) => l.productGuid === match.productGuid)) {
      this.toast.info(`${match.sku} is already in the cart`, undefined, { timer: 2000 });
      return;
    }
    this.addProduct(match);
    this.toast.success(
      `Added: ${match.sku}${match.productDescription ? ' · ' + match.productDescription : ''}`,
      undefined,
      { timer: 1800 },
    );
  }

  // --- Scale integration --------------------------------------------------

  captureWeightForLine(line: InvoiceProductDataModel, event?: Event): void {
    event?.preventDefault();
    if (!this.scaleService.isConnected()) {
      this.toast.info('No scale connected — configure in Settings', undefined, { timer: 2400 });
      return;
    }
    const reading = this.scaleService.currentReading();
    if (!reading) {
      this.toast.info('No reading yet — place the item on the scale', undefined, { timer: 2400 });
      return;
    }
    if (!reading.stable) {
      this.toast.warning('Scale not stable — wait for reading to settle', undefined, { timer: 2200 });
      return;
    }
    this.onLineFieldChange(line, 'netWeight', reading.grams);
  }

  private handleAltWeight(event: KeyboardEvent): void {
    const activeEl = document.activeElement as HTMLElement | null;
    const netWeightKey = activeEl?.getAttribute?.('data-net-weight-key');
    if (netWeightKey) {
      // Focus is on a net-weight input; capture into it.
      const line = this.cartLines().find((l) => l.productGuid === netWeightKey);
      if (line) {
        event.preventDefault();
        this.captureWeightForLine(line);
      }
      return;
    }
    // Otherwise, focus the first line's netWeight input (for HID keyboard
    // wedge scales, the next characters they type will fill it).
    const first = this.cartLines()[0];
    if (!first) { return; }
    const input = document.querySelector<HTMLInputElement>(
      `input[data-net-weight-key="${first.productGuid}"]`,
    );
    if (input) {
      event.preventDefault();
      input.focus();
      input.select();
    }
  }

  // --- Old-gold panel -----------------------------------------------------

  toggleOldGoldPanel(): void {
    this.oldGoldOpen.update((v) => !v);
  }

  openOldGoldPanel(): void {
    this.oldGoldOpen.set(true);
  }

  onOldGoldPurityChange(code: string): void {
    this.oldGoldPurityCode.set(code);
    // Auto-populate fineness + rate for the selected purity.
    const p = this.purities().find((row) => row.code === code);
    this.oldGoldFineness.set(p?.fineness ?? null);
    this.oldGoldRatePerGram.set(this.rateFor(code));
    this.recalcAll();
  }

  onOldGoldField(field: 'grossWeight' | 'fineness' | 'ratePerGram' | 'deductionPercent' | 'remarks', value: any): void {
    if (field === 'remarks') { this.oldGoldRemarks.set(String(value ?? '')); return; }
    const numeric = value === '' || value === null || value === undefined ? null : Number(value);
    if (numeric === null || Number.isNaN(numeric)) {
      if (field === 'grossWeight')       { this.oldGoldGrossWeight.set(0); }
      if (field === 'fineness')          { this.oldGoldFineness.set(null); }
      if (field === 'ratePerGram')       { this.oldGoldRatePerGram.set(0); }
      if (field === 'deductionPercent')  { this.oldGoldDeductionPercent.set(0); }
      this.recalcAll();
      return;
    }
    if (field === 'grossWeight')       { this.oldGoldGrossWeight.set(numeric); }
    if (field === 'fineness')          { this.oldGoldFineness.set(numeric); }
    if (field === 'ratePerGram')       { this.oldGoldRatePerGram.set(numeric); }
    if (field === 'deductionPercent')  { this.oldGoldDeductionPercent.set(numeric); }
    this.recalcAll();
  }

  captureWeightForOldGold(): void {
    if (!this.scaleService.isConnected()) {
      this.toast.info('No scale connected — configure in Settings', undefined, { timer: 2200 });
      return;
    }
    const reading = this.scaleService.currentReading();
    if (!reading) {
      this.toast.info('No reading yet — place the item on the scale', undefined, { timer: 2200 });
      return;
    }
    if (!reading.stable) {
      this.toast.warning('Scale not stable — wait for reading to settle', undefined, { timer: 2200 });
      return;
    }
    this.oldGoldGrossWeight.set(reading.grams);
    this.recalcAll();
  }

  async saveOldGoldReceipt(): Promise<void> {
    if (this.oldGoldSaving()) { return; }
    if (!this.selectedCustomer?.customerGuid) {
      this.dialog.fire({ icon: 'info', title: 'Customer required', text: 'Select a customer before saving old-gold.' });
      return;
    }
    if (this.oldGoldGrossWeight() <= 0) {
      this.dialog.fire({ icon: 'info', title: 'Gross weight required', text: 'Enter a positive gross weight.' });
      return;
    }
    if (this.oldGoldCreditAmount() <= 0) {
      this.dialog.fire({ icon: 'info', title: 'Credit is zero', text: 'Check purity, rate and deduction.' });
      return;
    }
    this.oldGoldSaving.set(true);
    try {
      const receipt = await this.oldGoldService.saveReceipt({
        customerGuid: this.selectedCustomer.customerGuid,
        invoiceGuid: null,
        grossWeight: this.oldGoldGrossWeight(),
        testedPurityCode: this.oldGoldPurityCode() ?? null,
        testedPurityPercent: this.oldGoldFineness() ?? null,
        deductionPercent: this.oldGoldDeductionPercent(),
        ratePerGram: this.oldGoldRatePerGram(),
        creditAmount: this.oldGoldCreditAmount(),
        remarks: this.oldGoldRemarks() || null,
        actorUserId: this.currentUserId,
      });
      if (!receipt || !receipt.receiptGuid) {
        this.toast.error('Old-gold receipt did not return a guid.', 'Save failed');
        return;
      }
      this.oldGoldReceiptGuid.set(receipt.receiptGuid);
      const state: CartOldGoldState = {
        receiptGuid: receipt.receiptGuid,
        grossWeight: this.oldGoldGrossWeight(),
        testedPurityCode: this.oldGoldPurityCode(),
        testedPurityPercent: this.oldGoldFineness() ?? null,
        ratePerGram: this.oldGoldRatePerGram(),
        deductionPercent: this.oldGoldDeductionPercent(),
        creditAmount: this.oldGoldCreditAmount(),
        remarks: this.oldGoldRemarks() || null,
        customerGuid: this.selectedCustomer.customerGuid,
      };
      this.cartService.setOldGold(state);
      this.recalcAll();
      this.toast.success(`Old-gold receipt saved (₹${this.money(this.oldGoldCreditAmount())})`, undefined, { timer: 1800 });
      this.oldGoldOpen.set(false);
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.saveOldGoldReceipt');
      this.toast.error('Failed to save old-gold receipt.', 'Error');
    } finally {
      this.oldGoldSaving.set(false);
      this.cdRef.detectChanges();
    }
  }

  async removeOldGold(): Promise<void> {
    // Delete the standalone (unbilled) receipt so it isn't left orphaned in the
    // DB. delete_old_gold_receipt only removes receipts not yet linked to an
    // invoice, so this is a no-op for an already-billed receipt.
    const guid = this.oldGoldReceiptGuid();
    if (guid) {
      try {
        await this.oldGoldService.deleteReceipt(guid, this.currentUserId);
      } catch (err) {
        this.loggerService.LogError(err, 'CartBuilder.removeOldGold');
      }
    }
    this.oldGoldReceiptGuid.set(null);
    this.oldGoldGrossWeight.set(0);
    this.oldGoldFineness.set(null);
    this.oldGoldDeductionPercent.set(DEFAULT_OLD_GOLD_DEDUCTION_PERCENT);
    this.oldGoldRemarks.set('');
    this.cartService.clearOldGold();
    this.recalcAll();
  }

  cancelOldGoldEdit(): void {
    this.oldGoldOpen.set(false);
  }

  // ---------------- Saving-scheme redemption (Workstream M) ----------------

  async refreshEligibleSchemes(): Promise<void> {
    const c = this.selectedCustomer;
    if (!c?.customerGuid) {
      this.eligibleSchemes.set([]);
      return;
    }
    try {
      const list = await this.savingSchemesService.getByCustomer(c.customerGuid);
      const eligible = (Array.isArray(list) ? list : []).filter(
        (s) => s.status === 'active' || s.status === 'matured',
      );
      this.eligibleSchemes.set(eligible);
    } catch (err) {
      this.loggerService.LogError(err, 'CartBuilder.refreshEligibleSchemes');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  openSchemePicker(): void {
    if (!this.selectedCustomer?.customerGuid) {
      this.toast.info('Select a customer first', undefined, { timer: 1400 });
      return;
    }
    this.refreshEligibleSchemes().then(() => this.schemePickerOpen.set(true));
  }

  closeSchemePicker(): void {
    this.schemePickerOpen.set(false);
  }

  applyScheme(scheme: SavingScheme): void {
    const corpus = Number(scheme.projectedCorpus ?? scheme.totalPaid ?? 0);
    const state: CartSchemeState = {
      schemeGuid: scheme.schemeGuid,
      planName: scheme.planName,
      customerGuid: scheme.customerGuid ?? this.selectedCustomer?.customerGuid ?? null,
      corpusAmount: corpus,
    };
    this.appliedScheme.set(state);
    this.cartService.setScheme(state);
    this.schemePickerOpen.set(false);
  }

  removeScheme(): void {
    this.appliedScheme.set(null);
    this.cartService.clearScheme();
  }

  grandTotalWithScheme(): number {
    const base = Number(this.totals().grandTotal ?? 0);
    const corpus = Number(this.appliedScheme()?.corpusAmount ?? 0);
    return Math.max(0, base - corpus);
  }
}
