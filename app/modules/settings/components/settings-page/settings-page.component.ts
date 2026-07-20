import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';

import { SettingsModel } from '../../models/settings-model';
import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { ShopSettings } from '../../../../interfaces/Shared/shop-settings';
import { MetalRateRow, MetalRateSession, MetalRateUpsertPayload } from '../../../../interfaces/Shared/metal-rate';
import { Purity } from '../../../../interfaces/Shared/purity';
import { TaxSlabRow } from '../../../../interfaces/Shared/tax-slab';
import { INDIAN_STATES, GSTIN_REGEX } from '../../../../shared/utils/indian-states';

type TabId = 'shop' | 'tax' | 'rates' | 'print' | 'backup' | 'users' | 'database';

interface TabDef { id: TabId; label: string; }

interface PurityRateEditor {
  purityCode: string;
  purityLabel: string;
  am: number | null;
  pm: number | null;
}

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
  imports: [CommonModule, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit, OnDestroy {

  readonly tabs: TabDef[] = [
    { id: 'shop',     label: 'Shop identity' },
    { id: 'tax',      label: 'Tax & invoice' },
    { id: 'rates',    label: 'Metal rates' },
    { id: 'print',    label: 'Print & hardware' },
    { id: 'backup',   label: 'Backup' },
    { id: 'users',    label: 'Users & permissions' },
    { id: 'database', label: 'Database' },
  ];

  readonly activeTab = signal<TabId>('shop');

  readonly indianStates = INDIAN_STATES;

  shopForm!: FormGroup;
  shopLogoPath: string | null = null;
  shopSaving = signal(false);

  invoiceForm!: FormGroup;
  invoiceCounterSaving = signal(false);
  taxSlabs = signal<TaxSlabRow[]>([]);

  purities = signal<Purity[]>([]);
  rateSession = signal<'today'>('today');
  rateEditors = signal<PurityRateEditor[]>([]);
  ratesSaving = signal(false);
  ratesEffectiveDate = signal<string>(new Date().toISOString().slice(0, 10));
  rateHistory = signal<MetalRateRow[]>([]);
  rateHistorySort = signal<'asc' | 'desc'>('desc');

  printForm!: FormGroup;

  usersList = signal<StubUser[]>([]);
  newUserForm!: FormGroup;

  dbForm!: FormGroup;
  dbFormInitialValues: any;
  isDefaultDbSettings = false;
  dbErrorMessageAfterReLaunch: string | null = null;
  private bodyPadding = document.getElementById('body')?.style.paddingTop;

  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fb = inject(FormBuilder);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly utilityService = inject(UtilityService);
  private readonly fileSystemService = inject(FileSystemService);
  private readonly shopSettingsService = inject(ShopSettingsService);
  private readonly metalRatesService = inject(MetalRatesService);
  private readonly puritiesService = inject(PuritiesService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    document.body.style.paddingTop = '0px';
    const state: any = this.location.getState();
    this.dbErrorMessageAfterReLaunch = state?.error ?? null;

    this.buildShopForm();
    this.buildInvoiceForm();
    this.buildPrintForm();
    this.buildNewUserForm();

    this.loadShopSettings();
    this.loadPurities();
    this.loadTaxSlabs();
    this.loadCurrentRates();
    this.loadRateHistory();
    this.loadUsersStub();
    this.loadDbSettings();
  }

  ngOnDestroy(): void {
    document.body.style.paddingTop = this.bodyPadding || '60px';
  }

  goBack() { this.location.back(); }

  setTab(id: TabId) { this.activeTab.set(id); }

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
      phone:        ['', [Validators.required, Validators.pattern(/^[0-9+\-\s]{7,15}$/)]],
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
  }

  async onShopLogoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { return; }
    try {
      const fileName = `shop-logo-${Date.now()}.jpg`;
      const dir = this.fileSystemService.userImagesDir || '';
      const savePath = `${dir}\\${fileName}`;
      const anyFs: any = this.fileSystemService;
      if (typeof anyFs.compressAndSaveImage === 'function') {
        await anyFs.compressAndSaveImage(savePath, file, 'shopLogo');
      }
      this.shopLogoPath = fileName;
      this.shopForm.markAsDirty();
    } catch (err) {
      this.loggerService.LogError(err, 'onShopLogoSelected');
      Swal.fire('Error', 'Failed to save logo', 'error');
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
      Swal.fire({ icon: 'success', title: 'Shop identity saved', timer: 1600, showConfirmButton: false });
    } catch (err) {
      this.loggerService.LogError(err, 'saveShopSettings');
      Swal.fire('Error', 'Failed to save shop identity', 'error');
    } finally {
      this.shopSaving.set(false);
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
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Reset invoice counter?',
      html: `Next invoice will start from <b>${proposed}</b>. This cannot be undone.`,
      showCancelButton: true,
      confirmButtonText: 'Reset',
      confirmButtonColor: '#ce2c31',
    });
    if (!result.isConfirmed) { return; }
    this.invoiceCounterSaving.set(true);
    try {
      await this.shopSettingsService.resetInvoiceCounter(proposed);
      await this.loadShopSettings();
      Swal.fire({ icon: 'success', title: 'Counter reset', timer: 1400, showConfirmButton: false });
    } catch (err) {
      this.loggerService.LogError(err, 'resetInvoiceCounter');
      Swal.fire('Error', 'Failed to reset counter', 'error');
    } finally {
      this.invoiceCounterSaving.set(false);
    }
  }

  // -------------------------------------------------------------------------
  // Metal rates
  // -------------------------------------------------------------------------
  private async loadPurities() {
    const rows = await this.puritiesService.getPurities();
    this.purities.set(rows);
    this.rebuildRateEditors();
  }

  private async loadCurrentRates() {
    await this.metalRatesService.getCurrent();
    this.rebuildRateEditors();
  }

  private async loadRateHistory() {
    const rows = await this.metalRatesService.getHistory(30);
    this.rateHistory.set(rows);
  }

  private rebuildRateEditors() {
    const purs = this.purities();
    const currentRates = this.metalRatesService.rates();

    const bySession: Record<MetalRateSession, Record<string, number>> = { AM: {}, PM: {} };
    for (const r of currentRates) {
      bySession[r.session] = bySession[r.session] ?? {};
      bySession[r.session][r.purityCode] = Number(r.ratePerGram);
    }

    const editors: PurityRateEditor[] = purs.map(p => ({
      purityCode: p.code,
      purityLabel: p.label,
      am: bySession.AM[p.code] ?? null,
      pm: bySession.PM[p.code] ?? null,
    }));
    this.rateEditors.set(editors);
  }

  updateRateAm(code: string, value: any) {
    const list = this.rateEditors().map(e => e.purityCode === code ? { ...e, am: value === '' ? null : Number(value) } : e);
    this.rateEditors.set(list);
  }
  updateRatePm(code: string, value: any) {
    const list = this.rateEditors().map(e => e.purityCode === code ? { ...e, pm: value === '' ? null : Number(value) } : e);
    this.rateEditors.set(list);
  }

  copyAmToPm() {
    this.rateEditors.set(this.rateEditors().map(e => ({ ...e, pm: e.am })));
  }

  async saveRates() {
    this.ratesSaving.set(true);
    try {
      const date = this.ratesEffectiveDate();
      const amRates: MetalRateUpsertPayload[] = this.rateEditors()
        .filter(e => e.am !== null && !Number.isNaN(e.am!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.am) }));
      const pmRates: MetalRateUpsertPayload[] = this.rateEditors()
        .filter(e => e.pm !== null && !Number.isNaN(e.pm!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.pm) }));

      if (amRates.length) {
        await this.metalRatesService.save({ effectiveDate: date, session: 'AM', source: 'manual', rates: amRates });
      }
      if (pmRates.length) {
        await this.metalRatesService.save({ effectiveDate: date, session: 'PM', source: 'manual', rates: pmRates });
      }
      await this.loadRateHistory();
      Swal.fire({ icon: 'success', title: 'Rates saved', timer: 1400, showConfirmButton: false });
    } catch (err) {
      this.loggerService.LogError(err, 'saveRates');
      Swal.fire('Error', 'Failed to save rates', 'error');
    } finally {
      this.ratesSaving.set(false);
    }
  }

  sortedHistory(): MetalRateRow[] {
    const dir = this.rateHistorySort();
    const rows = [...this.rateHistory()];
    return rows.sort((a, b) => {
      const av = a.effectiveDate ?? ''; const bv = b.effectiveDate ?? '';
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  toggleHistorySort() {
    this.rateHistorySort.set(this.rateHistorySort() === 'asc' ? 'desc' : 'asc');
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
    Swal.fire({ icon: 'success', title: 'Print preferences saved', timer: 1400, showConfirmButton: false });
  }

  testPrint() {
    window.print();
  }

  // -------------------------------------------------------------------------
  // Backup
  // -------------------------------------------------------------------------
  async exportBackup() {
    this.loggerService.LogInfo('Backup export requested (stub)');
    Swal.fire({
      icon: 'info',
      title: 'Not yet implemented',
      text: 'Encrypted backup export lands in Phase 2 (mysqldump + AES).',
    });
  }

  async restoreBackup() {
    this.loggerService.LogInfo('Backup restore requested (stub)');
    Swal.fire({
      icon: 'info',
      title: 'Not yet implemented',
      text: 'Backup restore lands in Phase 2 alongside export.',
    });
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
    Swal.fire({
      icon: 'info',
      title: 'Not yet implemented',
      text: 'Full user management + RBAC lands in Phase 2.',
    });
  }

  // -------------------------------------------------------------------------
  // Database (existing behavior preserved)
  // -------------------------------------------------------------------------
  private loadDbSettings() {
    this.storeService.get('currentDbInfo').then((data: SettingsModel) => {
      if (data == null) {
        this.storeService.get('defaultDbInfo').then((defaultData: SettingsModel) => {
          this.isDefaultDbSettings = true;
          this.populateDbForm(defaultData);
        });
      } else {
        this.isDefaultDbSettings = false;
        this.populateDbForm(data);
      }
    }).catch((error: any) => {
      this.loggerService.LogError(error, 'loadDbSettings');
    });
  }

  private populateDbForm(settingsData: SettingsModel, setInitialValues = true) {
    this.dbForm = this.fb.group({
      dbname:   [settingsData.DATABASE_NAME, Validators.required],
      port:     [settingsData.DATABASE_PORT, [Validators.required, Validators.min(0), Validators.max(65535)]],
      username: [settingsData.DATABASE_USERNAME, Validators.required],
      password: [settingsData.DATABASE_PASSWORD, Validators.required],
    });
    if (setInitialValues) { this.dbFormInitialValues = this.dbForm.value; }
  }

  saveDbSettings() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will change your database settings',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, proceed!',
    }).then((result) => {
      if (!result.isConfirmed) { return; }
      const currentDbInfo: SettingsModel = {
        DATABASE_NAME: this.dbForm.get('dbname')?.value,
        DATABASE_USERNAME: this.dbForm.get('username')?.value,
        DATABASE_PASSWORD: this.dbForm.get('password')?.value,
        DATABASE_PORT: this.dbForm.get('port')?.value,
        DATABASE_HOST: 'localhost',
        LAST_UPDATED_ON: new Date().toUTCString(),
      };
      this.storeService.set('currentDbInfo', currentDbInfo)
        .then(async () => {
          await this.storeService.delete('authData');
          this.loadDbSettings();
          Swal.fire({
            title: 'Settings Saved Successfully!',
            html: `<span class="text-success ">Relaunching App. Please Wait!</span>`,
            timer: 4000,
            timerProgressBar: true,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
          }).then(async (r) => {
            if (r.dismiss === Swal.DismissReason.timer) {
              try { await this.utilityService.relaunch(); }
              catch (err) { this.loggerService.LogError(err as string, 'relaunch()'); throw err; }
            }
          });
        })
        .catch((error: any) => {
          this.loggerService.LogError(error, 'saveDbSettings');
          Swal.fire('Error!', `Error saving DB settings: ${error}`, 'error');
        });
    });
  }

  resetDbForm() {
    this.dbForm.reset(this.dbFormInitialValues);
    this.isDefaultDbSettings = false;
  }

  resetDbToDefault() {
    this.storeService.get('defaultDbInfo').then((defaultData: SettingsModel) => {
      this.populateDbForm(defaultData, false);
      this.isDefaultDbSettings = true;
      this.dbForm.markAsDirty();
    });
  }

  getShopFieldError(name: string): string {
    const c = this.shopForm.get(name);
    if (!c || !c.touched) { return ''; }
    if (c.hasError('required')) { return 'Required'; }
    if (c.hasError('pattern')) {
      if (name === 'gstin') { return 'Invalid GSTIN (15 chars, e.g. 27AAACR5055K1Z5)'; }
      if (name === 'pincode') { return 'Invalid pincode'; }
      if (name === 'phone')   { return 'Invalid phone'; }
      return 'Invalid format';
    }
    if (c.hasError('email')) { return 'Invalid email'; }
    return '';
  }
}
