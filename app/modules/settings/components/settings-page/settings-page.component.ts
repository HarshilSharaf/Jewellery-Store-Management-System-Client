import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideScale,
  lucideScanBarcode,
  lucidePlug,
  lucidePlugZap,
  lucideRefreshCw,
  lucideCircleCheck,
  lucideCircleAlert,
  lucideEye,
  lucideEyeOff,
  lucideFolder,
  lucideTrash2,
  lucideDownload,
  lucideTriangleAlert,
  lucideUpload,
  lucideFileText,
  lucideFileSpreadsheet,
} from '@ng-icons/lucide';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { OnboardingService } from '../../../../../../Backend/Shared/onboarding.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';

import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { MetalRatesTabComponent } from '../metal-rates-tab/metal-rates-tab.component';
import { BackupService } from '../../../../shared/services/Backup/backup.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { ShopSettings } from '../../../../interfaces/Shared/shop-settings';
import { TaxSlabRow } from '../../../../interfaces/Shared/tax-slab';
import { ListBackupsEntry } from '../../../../interfaces/Backup/backup';
import { INDIAN_STATES, GSTIN_REGEX } from '../../../../shared/utils/indian-states';
import { ScaleService } from '../../../../shared/services/Hardware/scale.service';
import { ScannerService } from '../../../../shared/services/Hardware/scanner.service';
import {
  MigrationService,
  DuplicateStrategy,
  ImportResult,
  CustomerMapping,
  ProductMapping,
  RatesMapping,
} from '../../../../shared/services/Migration/migration.service';
import { exportToCSV } from '../../../../shared/utils/csv-export';
import { WhatsAppService } from '../../../../shared/services/WhatsApp/whatsapp.service';
import { WhatsappSendLogRow, WhatsappStatus } from '../../../../interfaces/WhatsApp/whatsapp';
import { TypographyService, TypographyPreset, PresetDefinition } from '../../../../shared/services/Typography/typography.service';

type TabId = 'shop' | 'tax' | 'rates' | 'print' | 'appearance' | 'backup' | 'users' | 'migration' | 'whatsapp' | 'whatsapp-activity' | 'language';
type MigrationEntity = 'customers' | 'products' | 'rates';

interface MigrationEntityState {
  fileName: string;
  headers: string[];
  rows: Record<string, string>[];
  issues: number[];
  mapping: Record<string, string>;
  duplicateStrategy: DuplicateStrategy;
  importing: boolean;
  result: ImportResult | null;
}

interface TabDef { id: TabId; label: string; }

interface StubUser {
  id: number;
  userName: string;
  email: string;
  role: string;
}

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, RouterLink, MetalRatesTabComponent],
  viewProviders: [provideIcons({
    lucideArrowLeft,
    lucideScale,
    lucideScanBarcode,
    lucidePlug,
    lucidePlugZap,
    lucideRefreshCw,
    lucideCircleCheck,
    lucideCircleAlert,
    lucideEye,
    lucideEyeOff,
    lucideFolder,
    lucideTrash2,
    lucideDownload,
    lucideTriangleAlert,
    lucideUpload,
    lucideFileText,
    lucideFileSpreadsheet,
  })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit, OnDestroy {

  readonly tabs: TabDef[] = [
    { id: 'shop',      label: $localize`:@@settings.tab.shop:Shop identity` },
    { id: 'tax',       label: $localize`:@@settings.tab.tax:Tax & invoice` },
    { id: 'rates',     label: $localize`:@@settings.tab.rates:Metal rates` },
    { id: 'print',     label: $localize`:@@settings.tab.print:Print & hardware` },
    { id: 'backup',    label: $localize`:@@settings.tab.backup:Backup` },
    { id: 'users',     label: $localize`:@@settings.tab.users:Users & permissions` },
    { id: 'migration', label: $localize`:@@settings.tab.migration:Migration` },
    { id: 'whatsapp',          label: $localize`:@@settings.tab.whatsapp:WhatsApp` },
    { id: 'whatsapp-activity', label: $localize`:@@settings.tab.whatsapp-activity:WhatsApp activity` },
    { id: 'appearance', label: $localize`:@@settings.tab.appearance:Appearance` },
    { id: 'language',  label: $localize`:@@settings.tab.language:Language` },
  ];

  readonly activeTab = signal<TabId>('shop');

  readonly indianStates = INDIAN_STATES;

  shopForm!: FormGroup;
  shopLogoPath: string | null = null;
  shopLogoSrc: string | null = null;   // base64 data URL for previewing the logo
  shopSaving = signal(false);

  invoiceForm!: FormGroup;
  invoiceCounterSaving = signal(false);
  taxSlabs = signal<TaxSlabRow[]>([]);

  printForm!: FormGroup;

  // Hardware panel state
  readonly scannerEnabled = signal<boolean>(true);
  readonly scanTestBuffer = signal<string>('');
  readonly baudRateOptions = [4800, 9600, 19200, 38400] as const;
  readonly scaleTestResult = signal<string>('');

  usersList = signal<StubUser[]>([]);
  newUserForm!: FormGroup;

  // Backup tab state
  backupForm!: FormGroup;
  restoreForm!: FormGroup;
  readonly backupList = signal<ListBackupsEntry[]>([]);
  readonly backupBusy = signal<boolean>(false);
  readonly backupProgress = signal<string>('');
  readonly backupPrereqWarning = signal<string>('');
  readonly showPassphrase = signal<boolean>(false);
  readonly showConfirmPassphrase = signal<boolean>(false);
  readonly showRestorePassphrase = signal<boolean>(false);
  readonly selectedBackup = signal<ListBackupsEntry | null>(null);

  dbErrorMessageAfterReLaunch: string | null = null;
  private bodyPadding = document.getElementById('body')?.style.paddingTop;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly fb = inject(FormBuilder);
  private readonly cdRef = inject(ChangeDetectorRef);
  private readonly migrationService = inject(MigrationService);
  private readonly onboardingService = inject(OnboardingService);

  /** True while the "Replay setup guide" action is resetting + navigating. */
  readonly replayingSetup = signal<boolean>(false);

  readonly customerFields: Array<{ key: keyof CustomerMapping; label: string }> = [
    { key: 'firstName',   label: 'First name' },
    { key: 'lastName',    label: 'Last name' },
    { key: 'phoneNumber', label: 'Phone (dedupe key)' },
    { key: 'email',       label: 'Email' },
    { key: 'gender',      label: 'Gender' },
    { key: 'dateOfBirth', label: 'Date of birth' },
    { key: 'address',     label: 'Address' },
    { key: 'city',        label: 'City' },
    { key: 'state',       label: 'State' },
    { key: 'stateCode',   label: 'State code' },
    { key: 'gstin',       label: 'GSTIN' },
    { key: 'pan',         label: 'PAN' },
    { key: 'remarks',     label: 'Remarks' },
  ];

  readonly productFields: Array<{ key: keyof ProductMapping; label: string }> = [
    { key: 'sku',                label: 'SKU (dedupe key)' },
    { key: 'huid',               label: 'HUID' },
    { key: 'purityCode',         label: 'Purity (22K / 916 / 18K...)' },
    { key: 'productDescription', label: 'Description' },
    { key: 'grossWeight',        label: 'Gross weight (g)' },
    { key: 'netWeight',          label: 'Net weight (g)' },
    { key: 'stoneWeight',        label: 'Stone weight (g)' },
    { key: 'stoneCharges',       label: 'Stone charges' },
    { key: 'makingMode',         label: 'Making mode (flat/perGram/percent)' },
    { key: 'makingValue',        label: 'Making value' },
    { key: 'wastagePercent',     label: 'Wastage %' },
    { key: 'costPrice',          label: 'Cost price (admin only)' },
    { key: 'tagPrice',           label: 'Tag price' },
    { key: 'hsnCode',            label: 'HSN' },
    { key: 'masterCategoryId',   label: 'Master category id' },
    { key: 'subCategoryId',      label: 'Sub category id' },
    { key: 'productCategoryId',  label: 'Product category id' },
  ];

  readonly ratesFields: Array<{ key: keyof RatesMapping; label: string }> = [
    { key: 'effectiveDate', label: 'Effective date (YYYY-MM-DD)' },
    { key: 'session',       label: 'Session (AM/PM)' },
    { key: 'purityCode',    label: 'Purity' },
    { key: 'ratePerGram',   label: 'Rate per gram' },
  ];

  readonly migrationState: Record<MigrationEntity, ReturnType<typeof signal<MigrationEntityState>>> = {
    customers: signal(this.emptyMigrationState()),
    products:  signal(this.emptyMigrationState()),
    rates:     signal(this.emptyMigrationState()),
  };

  private emptyMigrationState(): MigrationEntityState {
    return {
      fileName: '',
      headers: [],
      rows: [],
      issues: [],
      mapping: {},
      duplicateStrategy: 'skip',
      importing: false,
      result: null,
    };
  }

  readonly migrationEntities: MigrationEntity[] = ['customers', 'products', 'rates'];

  // WhatsApp settings tab.
  whatsappForm!: FormGroup;
  readonly showWhatsappToken = signal<boolean>(false);
  readonly whatsappSaving   = signal<boolean>(false);
  readonly whatsappTestBusy = signal<boolean>(false);
  readonly whatsappTestResult = signal<string>('');

  // WhatsApp activity tab.
  readonly whatsappActivity = signal<WhatsappSendLogRow[]>([]);
  readonly whatsappActivityLoading = signal<boolean>(false);
  readonly whatsappActivityStatusFilter = signal<WhatsappStatus | null>(null);
  readonly whatsappActivityDateFrom = signal<string>('');
  readonly whatsappActivityDateTo   = signal<string>('');
  readonly whatsappStatusOptions: WhatsappStatus[] = ['queued', 'sent', 'delivered', 'read', 'failed'];

  readonly whatsappTemplates: Array<{ name: string; description: string }> = [
    { name: 'invoice_ready',   description: 'Sent after a bill is finalised (customer name, invoice #, grand total).' },
    { name: 'scheme_reminder', description: 'Monthly reminder for saving-scheme installment due.' },
    { name: 'repair_ready',    description: 'Sent when a repair ticket status flips to ready.' },
    { name: 'birthday_greeting', description: 'Auto-sent on the customer\'s DOB (opt-in).' },
  ];

  getMigration(entity: MigrationEntity): MigrationEntityState {
    return this.migrationState[entity]();
  }
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly utilityService = inject(UtilityService);
  private readonly fileSystemService = inject(FileSystemService);
  private readonly shopSettingsService = inject(ShopSettingsService);
  private readonly puritiesService = inject(PuritiesService);
  readonly scaleService = inject(ScaleService);
  readonly scannerService = inject(ScannerService);
  private readonly backupService = inject(BackupService);
  readonly permissions = inject(PermissionsService);
  private readonly whatsappService = inject(WhatsAppService);
  private readonly typographyService = inject(TypographyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

  // Typography preset tab state.
  readonly typographyPresets: readonly PresetDefinition[] = this.typographyService.presets;
  readonly typographyOriginalPreset = signal<TypographyPreset>(this.typographyService.activePreset());
  readonly typographySelectedPreset = signal<TypographyPreset>(this.typographyService.activePreset());
  readonly typographySaving = signal<boolean>(false);
  readonly typographyDirty = signal<boolean>(false);

  readonly LOCALE_STORAGE_KEY = 'radiance.locale.preference';
  readonly availableLocales = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
  ];
  readonly activeLocale = signal<string>(
    (typeof document !== 'undefined' && document.documentElement?.lang) || 'en'
  );
  readonly requestedLocale = signal<string>(
    (typeof localStorage !== 'undefined' && localStorage.getItem(this.LOCALE_STORAGE_KEY)) ||
      this.activeLocale()
  );
  readonly localeDirty = signal<boolean>(false);
  readonly localeSaved = signal<boolean>(false);

  onLocaleSelect(code: string): void {
    this.requestedLocale.set(code);
    this.localeDirty.set(this.requestedLocale() !== this.activeLocale());
    this.localeSaved.set(false);
  }

  // -------------------------------------------------------------------------
  // Appearance — typography presets (Workstream Y)
  // -------------------------------------------------------------------------
  onTypographyPresetSelect(preset: TypographyPreset): void {
    this.typographySelectedPreset.set(preset);
    this.typographyDirty.set(preset !== this.typographyOriginalPreset());
    // Live preview — apply immediately without persisting. The Cancel path
    // reverts, and Save & apply commits to ShopSettings.
    this.typographyService.applyPreset(preset, { persistLocal: false });
  }

  isTypographyPresetActive(preset: TypographyPreset): boolean {
    return this.typographySelectedPreset() === preset;
  }

  cancelTypographyPreset(): void {
    const original = this.typographyOriginalPreset();
    this.typographySelectedPreset.set(original);
    this.typographyDirty.set(false);
    this.typographyService.applyPreset(original);
  }

  saveTypographyPreset(): void {
    const preset = this.typographySelectedPreset();
    this.typographySaving.set(true);
    try {
      this.typographyService.savePreset(preset);
      this.typographyOriginalPreset.set(preset);
      this.typographyDirty.set(false);
      this.toast.success('Typography preset saved', undefined, { timer: 1400 });
    } catch (err) {
      this.loggerService.LogError(err, 'saveTypographyPreset');
      this.toast.error('Failed to save typography preset.', 'Error');
    } finally {
      this.typographySaving.set(false);
    }
  }

  saveLocalePreference(): void {
    try {
      localStorage.setItem(this.LOCALE_STORAGE_KEY, this.requestedLocale());
      this.localeSaved.set(true);
      this.localeDirty.set(false);
    } catch { /* localStorage may be blocked */ }
  }

  ngOnInit(): void {
    document.body.style.paddingTop = '0px';
    const state: any = this.location.getState();
    this.dbErrorMessageAfterReLaunch = state?.error ?? null;

    this.buildShopForm();
    this.buildInvoiceForm();
    this.buildPrintForm();
    this.buildNewUserForm();
    this.buildBackupForms();
    this.buildWhatsappForm();

    this.loadShopSettings();
    this.loadTaxSlabs();
    this.loadUsersStub();
    this.loadBackups();
    this.loadWhatsappSettingsIntoForm();
    this.permissions.getUserPermissions().then(() => {
      if (!this.isTabVisible(this.activeTab())) {
        this.activeTab.set('shop');
      }
    });
    this.hydrateHardwarePreferences();
    this.scaleService.refreshPorts();

    // Mirror scanner emissions into the test buffer whenever the tab
    // isn't listening — this makes the "Scan test" field feel live even
    // if no explicit subscription button was clicked.
    this.scannerService.scan$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((code) => {
      this.scanTestBuffer.set(code);
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(qp => {
      const requested = qp.get('tab') as TabId | null;
      if (requested && this.tabs.some(t => t.id === requested)) {
        this.setTab(requested);
      }
    });
  }

  private hydrateHardwarePreferences(): void {
    const pref = localStorage.getItem('jsms.scanner.cart.enabled');
    const enabled = pref !== '0';
    this.scannerEnabled.set(enabled);
    if (enabled) { this.scannerService.enable(); } else { this.scannerService.disable(); }
  }

  ngOnDestroy(): void {
    document.body.style.paddingTop = this.bodyPadding || '60px';
  }

  goBack() { this.location.back(); }

  setTab(id: TabId) {
    this.activeTab.set(id);
    if (id === 'whatsapp-activity') { this.loadWhatsappActivity(); }
  }

  isTabVisible(id: TabId): boolean {
    if (id === 'backup') { return this.permissions.permissions().canBackup; }
    if (id === 'users')  { return this.permissions.permissions().canManageUsers; }
    return true;
  }

  // -------------------------------------------------------------------------
  // Shop identity
  // -------------------------------------------------------------------------
  private buildShopForm() {
    this.shopForm = this.fb.group({
      shopName:     ['', Validators.required],
      addressLine1: ['', Validators.required],
      addressLine2: [''],
      city:         ['', Validators.required],
      state:        ['', Validators.required],
      stateCode:    ['', Validators.required],
      pincode:      ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
      phone:        ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
      email:        ['', [Validators.email]],
      gstin:        ['', [Validators.required, Validators.pattern(GSTIN_REGEX)]],
      pan:          [''],
    });

    this.shopForm.get('state')?.valueChanges.subscribe((stateName: string) => {
      const match = this.indianStates.find(s => s.name === stateName);
      if (match) { this.shopForm.patchValue({ stateCode: match.code }, { emitEvent: false }); }
    });
  }

  private async loadShopSettings() {
    const row = await this.shopSettingsService.get();
    if (!row) { return; }
    this.shopLogoPath = row.logoPath ?? null;
    this.shopLogoSrc = this.shopLogoPath
      ? await (this.fileSystemService as any).getUserImageInBase64(this.shopLogoPath)
      : null;
    this.shopForm.patchValue({
      shopName:     row.shopName,
      addressLine1: row.addressLine1,
      addressLine2: row.addressLine2 ?? '',
      city:         row.city,
      state:        row.state,
      stateCode:    row.stateCode,
      pincode:      row.pincode,
      phone:        row.phone,
      email:        row.email ?? '',
      gstin:        row.gstin,
      pan:          row.pan ?? '',
    }, { emitEvent: false });

    this.invoiceForm?.patchValue({
      invoicePrefix:          row.invoicePrefix,
      currentInvoiceCounter:  row.currentInvoiceCounter,
      invoiceStartFrom:       row.invoiceStartFrom,
      roundOffEnabled:        row.roundOffEnabled ? true : false,
    }, { emitEvent: false });

    // Typography preset lives in localStorage today (see TypographyService).
    // Nothing to reconcile from ShopSettings.
  }

  async onShopLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }
    try {
      const fileName = `shop-logo-${Date.now()}.jpg`;
      const anyFs: any = this.fileSystemService;
      // saveShopLogo awaits directory init (so userImagesDir is populated) and
      // ensures the folder exists before writing.
      await anyFs.saveShopLogo(file, fileName);
      this.shopLogoPath = fileName;
      this.shopLogoSrc = await anyFs.getUserImageInBase64(fileName);
      this.shopForm.markAsDirty();
    } catch (err) {
      this.loggerService.LogError(err, 'onShopLogoSelected');
      this.toast.error('Failed to save logo', 'Error');
    }
  }

  async saveShopSettings() {
    if (!this.shopForm.valid) {
      this.shopForm.markAllAsTouched();
      return;
    }
    const raw = this.shopForm.value;
    const payload: ShopSettings = {
      shopName:              raw.shopName,
      gstin:                 raw.gstin?.toUpperCase() ?? '',
      pan:                   raw.pan ? raw.pan.toUpperCase() : null,
      addressLine1:          raw.addressLine1,
      addressLine2:          raw.addressLine2 || null,
      city:                  raw.city,
      state:                 raw.state,
      stateCode:             raw.stateCode,
      pincode:               raw.pincode,
      phone:                 raw.phone,
      email:                 raw.email || null,
      logoPath:              this.shopLogoPath,
      invoicePrefix:         this.invoiceForm?.value?.invoicePrefix ?? 'INV/',
      invoiceStartFrom:      Number(this.invoiceForm?.value?.invoiceStartFrom ?? 1),
      currentInvoiceCounter: Number(this.invoiceForm?.value?.currentInvoiceCounter ?? 1),
      defaultCurrency:       'INR',
      timezone:              'Asia/Kolkata',
      roundOffEnabled:       this.invoiceForm?.value?.roundOffEnabled ? 1 : 0,
    };
    this.shopSaving.set(true);
    try {
      await this.shopSettingsService.save(payload);
      this.shopForm.markAsPristine();
      this.toast.success('Shop identity saved', undefined, { timer: 1600 });
    } catch (err) {
      this.loggerService.LogError(err, 'saveShopSettings');
      this.toast.error('Failed to save shop identity', 'Error');
    } finally {
      this.shopSaving.set(false);
    }
  }

  /**
   * Re-runs the first-run setup wizard. Clears the onboarding `completed` flag
   * (password step stays skipped since the password was already changed) and
   * navigates to the wizard route.
   */
  async replaySetupGuide(): Promise<void> {
    if (this.replayingSetup()) { return; }
    this.replayingSetup.set(true);
    try {
      await this.onboardingService.reset();
      await this.router.navigate(['/onboarding']);
    } catch (err) {
      this.loggerService.LogError(err, 'replaySetupGuide');
      this.toast.error('Could not start the setup guide', 'Error');
      this.replayingSetup.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Tax & invoice
  // -------------------------------------------------------------------------
  private buildInvoiceForm() {
    this.invoiceForm = this.fb.group({
      invoicePrefix:         ['INV/', Validators.required],
      currentInvoiceCounter: [{ value: 1, disabled: true }],
      invoiceStartFrom:      [1],
      roundOffEnabled:       [true],
    });
  }

  private async loadTaxSlabs() {
    const slabs = await this.puritiesService.getTaxSlabs();
    this.taxSlabs.set(Array.isArray(slabs) ? slabs : []);
  }

  async resetInvoiceCounter() {
    const proposed = Number(this.invoiceForm.value.invoiceStartFrom ?? 1);
    const result = await this.dialog.fire({
      icon: 'warning',
      title: 'Reset invoice counter?',
      html: `Next invoice will start from <b>${proposed}</b>. This cannot be undone.`,
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Reset',
    });
    if (!result.isConfirmed) { return; }
    this.invoiceCounterSaving.set(true);
    try {
      await this.shopSettingsService.resetInvoiceCounter(proposed);
      await this.loadShopSettings();
      this.toast.success('Counter reset', undefined, { timer: 1400 });
    } catch (err) {
      this.loggerService.LogError(err, 'resetInvoiceCounter');
      this.toast.error('Failed to reset counter', 'Error');
    } finally {
      this.invoiceCounterSaving.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Print & hardware
  // -------------------------------------------------------------------------
  private buildPrintForm() {
    const stored = localStorage.getItem('jsms.print.settings');
    const seed = stored ? JSON.parse(stored) : { defaultVariant: 'A4', thermalPrinterName: '' };
    this.printForm = this.fb.group({
      defaultVariant:     [seed.defaultVariant ?? 'A4', Validators.required],
      thermalPrinterName: [seed.thermalPrinterName ?? ''],
    });
  }

  savePrintSettings() {
    localStorage.setItem('jsms.print.settings', JSON.stringify(this.printForm.value));
    this.toast.success('Print preferences saved', undefined, { timer: 1400 });
  }

  testPrint() {
    window.print();
  }

  // -------------------------------------------------------------------------
  // Hardware — scanner
  // -------------------------------------------------------------------------
  toggleScannerEnabled(): void {
    const next = !this.scannerEnabled();
    this.scannerEnabled.set(next);
    localStorage.setItem('jsms.scanner.cart.enabled', next ? '1' : '0');
    if (next) { this.scannerService.enable(); } else { this.scannerService.disable(); }
  }

  simulateScan(): void {
    this.scannerService.emit('TEST-BARCODE-' + Math.floor(Math.random() * 10_000));
  }

  onScanTestInput(value: string): void {
    this.scanTestBuffer.set(value);
  }

  clearScanTestBuffer(): void {
    this.scanTestBuffer.set('');
  }

  // -------------------------------------------------------------------------
  // Hardware — weighing scale
  // -------------------------------------------------------------------------
  async refreshScalePorts(): Promise<void> {
    await this.scaleService.refreshPorts();
  }

  onScalePortChange(portPath: string): void {
    this.scaleService.setPort(portPath);
  }

  onScaleBaudChange(baud: string | number): void {
    this.scaleService.setBaud(Number(baud));
  }

  async connectScale(): Promise<void> {
    const ok = await this.scaleService.connect();
    if (!ok) {
      this.toast.error(this.scaleService.lastError() ?? 'Unable to open the selected serial port.', 'Failed to connect');
    } else {
      this.toast.success('Scale connected', undefined, { timer: 1400 });
    }
  }

  async disconnectScale(): Promise<void> {
    await this.scaleService.disconnect();
  }

  async testScaleReading(): Promise<void> {
    const r = await this.scaleService.pollOnce();
    if (r) {
      this.scaleTestResult.set(`${r.grams.toFixed(3)} g · ${r.stable ? 'stable' : 'unstable'}`);
    } else {
      this.scaleTestResult.set('No reading available. Place an item on the scale.');
    }
  }

  // -------------------------------------------------------------------------
  // Backup
  // -------------------------------------------------------------------------
  private buildBackupForms() {
    this.backupForm = this.fb.group({
      passphrase:        ['', [Validators.required, Validators.minLength(8)]],
      confirmPassphrase: ['', [Validators.required]],
      targetDir:         [''],
    }, { validators: (group) => {
      const a = group.get('passphrase')?.value;
      const b = group.get('confirmPassphrase')?.value;
      return a && b && a !== b ? { passphraseMismatch: true } : null;
    }});

    this.restoreForm = this.fb.group({
      passphrase: ['', [Validators.required, Validators.minLength(8)]],
    });
  }

  async loadBackups() {
    try {
      const dir = this.backupForm?.value?.targetDir || null;
      const rows = await this.backupService.list(dir);
      this.backupList.set(rows);
    } catch (err) {
      this.loggerService.LogError(err, 'loadBackups');
      this.backupList.set([]);
    }
  }

  togglePassphraseVisibility() { this.showPassphrase.set(!this.showPassphrase()); }
  toggleConfirmPassphraseVisibility() { this.showConfirmPassphrase.set(!this.showConfirmPassphrase()); }
  toggleRestorePassphraseVisibility() { this.showRestorePassphrase.set(!this.showRestorePassphrase()); }

  async chooseBackupDirectory() {
    const picked = await this.backupService.pickDirectory(this.backupForm?.value?.targetDir);
    if (picked) {
      this.backupForm.patchValue({ targetDir: picked });
      await this.loadBackups();
    }
  }

  async createBackupArchive() {
    if (!this.backupForm.valid || this.backupForm.hasError('passphraseMismatch')) {
      this.backupForm.markAllAsTouched();
      return;
    }
    const raw = this.backupForm.value;
    this.backupBusy.set(true);
    this.backupProgress.set('Encrypting...');
    try {
      const result = await this.backupService.create({
        passphrase: raw.passphrase,
        targetDir:  raw.targetDir || '',
      });
      this.dialog.fire({
        icon: 'success',
        title: 'Backup created',
        html: `<div class="text-left"><b>${result.filename}</b><br/>${this.formatBytes(result.sizeBytes)}</div>`,
        timer: 2400,
        showConfirmButton: false,
      });
      this.backupPrereqWarning.set('');
      await this.loadBackups();
    } catch (err: any) {
      const msg = String(err?.message || err);
      this.loggerService.LogError(err, 'createBackupArchive');
      this.dialog.fire({ icon: 'error', title: 'Backup failed', text: msg });
    } finally {
      this.backupBusy.set(false);
      this.backupProgress.set('');
    }
  }

  selectBackup(entry: ListBackupsEntry | null) {
    this.selectedBackup.set(entry);
  }

  async restoreBackupArchive() {
    const entry = this.selectedBackup();
    if (!entry) {
      this.dialog.fire({ icon: 'warning', title: 'Select a backup', text: 'Choose an archive from the list first.' });
      return;
    }
    if (!this.restoreForm.valid) {
      this.restoreForm.markAllAsTouched();
      return;
    }
    const confirm1 = await this.dialog.fire({
      icon: 'warning',
      title: 'Restore this archive?',
      html: `<div class="text-left">This will overwrite the current database with <b>${entry.filename}</b>.</div>`,
      showCancelButton: true,
      confirmButtonText: 'Continue',
    });
    if (!confirm1.isConfirmed) { return; }
    const confirm2 = await this.dialog.fire({
      icon: 'warning',
      title: 'Are you sure?',
      text: 'This action cannot be undone. The app will restart after restoring.',
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Restore now',
    });
    if (!confirm2.isConfirmed) { return; }

    this.backupBusy.set(true);
    this.backupProgress.set('Restoring...');
    try {
      await this.backupService.restore({
        passphrase: this.restoreForm.value.passphrase,
        archivePath: entry.path,
      });
      this.dialog.fire({
        icon: 'success',
        title: 'Restore complete',
        html: 'Relaunching the app in a moment...',
        timer: 2400,
        showConfirmButton: false,
      }).then(async () => {
        try { await this.utilityService.relaunch(); }
        catch (err) { this.loggerService.LogError(err as string, 'relaunch()'); }
      });
    } catch (err: any) {
      const msg = String(err?.message || err);
      this.loggerService.LogError(err, 'restoreBackupArchive');
      this.dialog.fire({ icon: 'error', title: 'Restore failed', text: msg });
    } finally {
      this.backupBusy.set(false);
      this.backupProgress.set('');
    }
  }

  async deleteBackupArchive(entry: ListBackupsEntry) {
    if (!this.permissions.permissions().canBackup) { return; }
    const confirm1 = await this.dialog.fire({
      icon: 'warning',
      title: 'Delete this archive?',
      html: `<div class="text-left"><b>${entry.filename}</b></div>`,
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });
    if (!confirm1.isConfirmed) { return; }
    const confirm2 = await this.dialog.fire({
      icon: 'warning',
      title: 'Confirm delete',
      text: 'This cannot be undone.',
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    });
    if (!confirm2.isConfirmed) { return; }
    try {
      const authData: any = await this.storeService.get('authData');
      await this.backupService.delete(entry.path, authData?.type);
      if (this.selectedBackup()?.path === entry.path) { this.selectBackup(null); }
      await this.loadBackups();
      this.toast.success('Deleted', undefined, { timer: 1200 });
    } catch (err: any) {
      this.loggerService.LogError(err, 'deleteBackupArchive');
      this.dialog.fire({ icon: 'error', title: 'Delete failed', text: String(err?.message || err) });
    }
  }

  formatBytes(bytes: number): string {
    if (!bytes || bytes < 1024) { return `${bytes || 0} B`; }
    if (bytes < 1024 * 1024) { return `${(bytes / 1024).toFixed(1)} KB`; }
    if (bytes < 1024 * 1024 * 1024) { return `${(bytes / (1024 * 1024)).toFixed(2)} MB`; }
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  formatDateTime(iso: string): string {
    if (!iso) { return ''; }
    try { return new Date(iso).toLocaleString(); } catch { return iso; }
  }

  // -------------------------------------------------------------------------
  // WhatsApp settings + activity
  // -------------------------------------------------------------------------
  private buildWhatsappForm() {
    this.whatsappForm = this.fb.group({
      whatsappEnabled:            [false],
      whatsappPhoneNumberId:      [''],
      whatsappBusinessAccountId:  [''],
      whatsappApiToken:           [''],
    });
  }

  private async loadWhatsappSettingsIntoForm(): Promise<void> {
    const row = await this.shopSettingsService.get();
    if (!row) { return; }
    this.whatsappForm?.patchValue({
      whatsappEnabled:           !!row.whatsappEnabled,
      whatsappPhoneNumberId:     row.whatsappPhoneNumberId ?? '',
      whatsappBusinessAccountId: row.whatsappBusinessAccountId ?? '',
      whatsappApiToken:          row.whatsappApiToken ?? '',
    }, { emitEvent: false });
  }

  toggleWhatsappTokenVisibility(): void {
    this.showWhatsappToken.set(!this.showWhatsappToken());
  }

  async saveWhatsappSettings(): Promise<void> {
    this.whatsappSaving.set(true);
    try {
      const raw = this.whatsappForm.value;
      await this.shopSettingsService.saveWhatsappSettings({
        whatsappPhoneNumberId:     raw.whatsappPhoneNumberId?.trim() || null,
        whatsappBusinessAccountId: raw.whatsappBusinessAccountId?.trim() || null,
        whatsappApiToken:          raw.whatsappApiToken?.trim() || null,
        whatsappEnabled:           raw.whatsappEnabled ? 1 : 0,
      });
      this.toast.success('WhatsApp settings saved', undefined, { timer: 1400 });
    } catch (err) {
      this.loggerService.LogError(err, 'saveWhatsappSettings');
      this.toast.error(String((err as any)?.message ?? err), 'Error');
    } finally {
      this.whatsappSaving.set(false);
    }
  }

  async sendWhatsappTestMessage(): Promise<void> {
    // Uses the *current form values*, not the persisted ones, so users can
    // verify credentials without saving them. However the main-process
    // orchestrator today reads from `shopsettings` — so if the user hasn't
    // saved, we tell them explicitly.
    const raw = this.whatsappForm.value;
    if (!raw.whatsappPhoneNumberId || !raw.whatsappApiToken || !raw.whatsappEnabled) {
      this.whatsappTestResult.set('Enable + fill Phone Number ID + Token, then save. The orchestrator reads config from shopsettings.');
      return;
    }
    this.whatsappTestBusy.set(true);
    this.whatsappTestResult.set('Sending test message...');
    try {
      const shop = await this.shopSettingsService.get();
      const auth: any = await this.storeService.get('authData');
      const shopPhone = shop?.phone ? String(shop.phone).replace(/[^0-9+]/g, '') : '';
      if (!shopPhone) {
        this.whatsappTestResult.set('Shop phone number missing in Shop identity. Save it first.');
        return;
      }
      // We send a queued row via the main-process orchestrator. Meta will
      // reject unapproved templates so `hello_world` is the safe smoke test.
      const res = await this.whatsappService.send({
        invoiceGuid:      null,
        customerGuid:     '',   // orchestrator SP allows null via NULL fallback
        templateName:     'hello_world',
        templateLanguage: 'en_US',
        templateVariables: [],
        phoneNumber:      shopPhone,
        sentByUserId:     auth?.uid ?? null,
      });
      if (res.ok) {
        this.whatsappTestResult.set(`Sent. Meta id: ${res.messageId ?? '—'} · sendGuid ${res.sendGuid ?? '—'}`);
      } else if (res.error === 'not_configured') {
        this.whatsappTestResult.set('Not configured — save the form first so the orchestrator can read from shopsettings.');
      } else {
        this.whatsappTestResult.set(`Failed: ${res.error ?? 'unknown'}`);
      }
    } catch (err) {
      this.loggerService.LogError(err, 'sendWhatsappTestMessage');
      this.whatsappTestResult.set(`Error: ${(err as any)?.message ?? err}`);
    } finally {
      this.whatsappTestBusy.set(false);
    }
  }

  toggleWhatsappActivityStatus(s: WhatsappStatus): void {
    this.whatsappActivityStatusFilter.set(this.whatsappActivityStatusFilter() === s ? null : s);
    this.loadWhatsappActivity();
  }

  isWhatsappStatusActive(s: WhatsappStatus): boolean {
    return this.whatsappActivityStatusFilter() === s;
  }

  onWhatsappDateFromChange(v: string): void { this.whatsappActivityDateFrom.set(v); this.loadWhatsappActivity(); }
  onWhatsappDateToChange(v: string):   void { this.whatsappActivityDateTo.set(v);   this.loadWhatsappActivity(); }

  clearWhatsappFilters(): void {
    this.whatsappActivityStatusFilter.set(null);
    this.whatsappActivityDateFrom.set('');
    this.whatsappActivityDateTo.set('');
    this.loadWhatsappActivity();
  }

  async loadWhatsappActivity(): Promise<void> {
    this.whatsappActivityLoading.set(true);
    try {
      const rows: any[] = await this.whatsappService.getLog({
        status: this.whatsappActivityStatusFilter(),
        dateFrom: this.whatsappActivityDateFrom() || null,
        dateTo:   this.whatsappActivityDateTo() || null,
        pageSize: 100,
        page: 1,
      });
      const list = rows.filter((r: any) => r?.sendGuid) as WhatsappSendLogRow[];
      this.whatsappActivity.set(list);
    } catch (err) {
      this.loggerService.LogError(err, 'loadWhatsappActivity');
      this.whatsappActivity.set([]);
    } finally {
      this.whatsappActivityLoading.set(false);
    }
  }

  whatsappStatusClass(s: string | undefined): string {
    return s ? `status-chip status-chip--${s}` : 'status-chip';
  }

  whatsappShortGuid(g: string | undefined): string {
    if (!g) return '—';
    return g.slice(0, 8);
  }

  // -------------------------------------------------------------------------
  // Users & permissions (stub — full RBAC in Phase 2)
  // -------------------------------------------------------------------------
  private buildNewUserForm() {
    this.newUserForm = this.fb.group({
      userName: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      role:     ['cashier', Validators.required],
    });
  }

  private loadUsersStub() {
    this.usersList.set([
      { id: 1, userName: 'admin',    email: 'admin@shop.local',   role: 'admin' },
      { id: 2, userName: 'cashier1', email: 'cashier@shop.local', role: 'cashier' },
    ]);
  }

  addUserStub() {
    if (!this.newUserForm.valid) { this.newUserForm.markAllAsTouched(); return; }
    this.dialog.fire({
      icon: 'info',
      title: 'Not yet implemented',
      text: 'Full user management + RBAC lands in Phase 2.',
    });
  }

  // -------------------------------------------------------------------------
  // Migration (Workstream R)
  // -------------------------------------------------------------------------

  private guessMapping(headers: string[], fieldKeys: string[]): Record<string, string> {
    const map: Record<string, string> = {};
    const lower = headers.map(h => h.toLowerCase());
    for (const key of fieldKeys) {
      const k = key.toLowerCase();
      const idx = lower.findIndex(h =>
        h === k ||
        h === k.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase() ||
        h.replace(/[^a-z0-9]/g, '') === k.replace(/[^a-z0-9]/g, '')
      );
      if (idx >= 0) { map[key] = headers[idx]; }
    }
    return map;
  }

  async onMigrationFileSelected(entity: MigrationEntity, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }

    let preview;
    if (entity === 'customers') {
      preview = await this.migrationService.previewCustomerCsv(file);
    } else if (entity === 'products') {
      preview = await this.migrationService.previewProductCsv(file);
    } else {
      preview = await this.migrationService.previewRatesCsv(file);
    }

    const fields = this.fieldsFor(entity);
    const mapping = this.guessMapping(preview.headers, fields);

    const state: MigrationEntityState = {
      fileName: file.name,
      headers: preview.headers,
      rows: preview.rows,
      issues: preview.issues.map(i => i.rowIndex).filter(i => i >= 0),
      mapping,
      duplicateStrategy: this.migrationState[entity]().duplicateStrategy,
      importing: false,
      result: null,
    };
    this.migrationState[entity].set(state);
  }

  private fieldsFor(entity: MigrationEntity): string[] {
    if (entity === 'customers') { return this.customerFields.map(f => f.key as string); }
    if (entity === 'products')  { return this.productFields.map(f => f.key as string); }
    return this.ratesFields.map(f => f.key as string);
  }

  fieldDefsFor(entity: MigrationEntity) {
    if (entity === 'customers') { return this.customerFields; }
    if (entity === 'products')  { return this.productFields; }
    return this.ratesFields;
  }

  onMappingChange(entity: MigrationEntity, targetField: string, sourceHeader: string): void {
    const s = { ...this.migrationState[entity]() };
    s.mapping = { ...s.mapping, [targetField]: sourceHeader };
    this.migrationState[entity].set(s);
  }

  reverseMappingLookup(entity: MigrationEntity, sourceHeader: string): string {
    const map = this.migrationState[entity]().mapping;
    for (const key of Object.keys(map)) {
      if (map[key] === sourceHeader) { return key; }
    }
    return '';
  }

  setMappingFromSource(entity: MigrationEntity, sourceHeader: string, targetField: string): void {
    const s = { ...this.migrationState[entity]() };
    const newMap: Record<string, string> = {};
    for (const key of Object.keys(s.mapping)) {
      if (s.mapping[key] !== sourceHeader) { newMap[key] = s.mapping[key]; }
    }
    if (targetField) {
      for (const key of Object.keys(newMap)) {
        if (key === targetField) { delete newMap[key]; }
      }
      newMap[targetField] = sourceHeader;
    }
    s.mapping = newMap;
    this.migrationState[entity].set(s);
  }

  setDuplicateStrategy(entity: MigrationEntity, strategy: DuplicateStrategy): void {
    const s = { ...this.migrationState[entity]() };
    s.duplicateStrategy = strategy;
    this.migrationState[entity].set(s);
  }

  previewRows(entity: MigrationEntity, max = 20): Record<string, string>[] {
    return this.migrationState[entity]().rows.slice(0, max);
  }

  isRowIssue(entity: MigrationEntity, idx: number): boolean {
    return this.migrationState[entity]().issues.includes(idx);
  }

  async runImport(entity: MigrationEntity): Promise<void> {
    const s = { ...this.migrationState[entity]() };
    if (!s.rows.length) { return; }
    s.importing = true;
    this.migrationState[entity].set(s);

    let result: ImportResult;
    try {
      if (entity === 'customers') {
        result = await this.migrationService.importCustomers(s.rows, s.mapping as CustomerMapping, s.duplicateStrategy);
      } else if (entity === 'products') {
        result = await this.migrationService.importProducts(s.rows, s.mapping as ProductMapping, s.duplicateStrategy);
      } else {
        result = await this.migrationService.importRates(s.rows, s.mapping as RatesMapping, s.duplicateStrategy);
      }
    } catch (err: any) {
      this.loggerService.LogError(err, 'runImport');
      result = { imported: 0, updated: 0, skipped: 0, failed: s.rows.length, failedRows: s.rows.map(r => ({ ...r, _error: String(err?.message ?? err) })) };
    }

    const done = { ...this.migrationState[entity]() };
    done.importing = false;
    done.result = result;
    this.migrationState[entity].set(done);
  }

  downloadFailedRows(entity: MigrationEntity): void {
    const result = this.migrationState[entity]().result;
    if (!result || !result.failedRows.length) { return; }
    exportToCSV(result.failedRows, `failed-${entity}-${Date.now()}.csv`);
  }

  resetMigrationState(entity: MigrationEntity): void {
    this.migrationState[entity].set(this.emptyMigrationState());
  }

  async exportCustomersNow(): Promise<void> {
    try {
      await this.migrationService.triggerExportCustomers();
    } catch (err) {
      this.loggerService.LogError(err, 'exportCustomersNow');
      this.toast.error('Unable to export customers.', 'Export failed');
    }
  }

  async exportProductsNow(): Promise<void> {
    try {
      await this.migrationService.triggerExportProducts(this.permissions.costsVisible());
    } catch (err) {
      this.loggerService.LogError(err, 'exportProductsNow');
      this.toast.error('Unable to export products.', 'Export failed');
    }
  }

  async exportRatesNow(): Promise<void> {
    try {
      await this.migrationService.triggerExportRates();
    } catch (err) {
      this.loggerService.LogError(err, 'exportRatesNow');
      this.toast.error('Unable to export rates.', 'Export failed');
    }
  }

  progressPercent(entity: MigrationEntity): number {
    const s = this.migrationState[entity]();
    if (!s.result) { return s.importing ? 40 : 0; }
    const total = Math.max(1, s.rows.length);
    return Math.min(100, Math.round(((s.result.imported + s.result.updated + s.result.skipped + s.result.failed) / total) * 100));
  }

  costsHidden(): boolean {
    return !this.permissions.costsVisible();
  }

  getShopFieldError(name: string): string {
    const c = this.shopForm.get(name);
    // Surface the error once the field has been interacted with OR when it
    // loaded invalid from the DB (dirty covers edits; !pristine || invalid+value
    // covers pre-filled bad data). Showing it for a pre-filled invalid value is
    // what tells the user why Save is disabled.
    if (!c || (!c.touched && !c.dirty && c.valid)) { return ''; }
    if (c.hasError('required')) { return 'Required'; }
    if (c.hasError('pattern')) {
      if (name === 'gstin') { return 'Invalid GSTIN (15 chars, e.g. 27AAACR5055K1Z5)'; }
      if (name === 'pincode') { return 'Invalid pincode (6 digits)'; }
      if (name === 'phone')   { return 'Invalid phone (7–20 chars: digits, spaces, + - ( ) only)'; }
      return 'Invalid format';
    }
    if (c.hasError('email')) { return 'Invalid email'; }
    return '';
  }

  /** Human-readable labels of the shop-form fields that are currently invalid.
   *  Drives the "fix these to save" hint next to the disabled Save button, so
   *  the reason is visible even for fields the user hasn't touched. */
  invalidShopFields(): string[] {
    if (!this.shopForm) { return []; }
    const labels: Record<string, string> = {
      shopName: 'Shop name', addressLine1: 'Address line 1', city: 'City',
      state: 'State', stateCode: 'State code', pincode: 'Pincode',
      phone: 'Phone', email: 'Email', gstin: 'GSTIN',
    };
    return Object.keys(labels).filter((k) => this.shopForm.get(k)?.invalid).map((k) => labels[k]);
  }
}
