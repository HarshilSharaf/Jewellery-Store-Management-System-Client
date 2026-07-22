import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowRight,
  lucideChevronLeft,
  lucideCommand,
  lucideCornerDownLeft,
  lucideHammer,
  lucideLayoutDashboard,
  lucideMoon,
  lucidePackage,
  lucidePiggyBank,
  lucidePlus,
  lucideReceipt,
  lucideRefreshCcw,
  lucideSearch,
  lucideShoppingCart,
  lucideSun,
  lucideTag,
  lucideTags,
  lucideUser,
  lucideUserPlus,
  lucideUsers,
  lucideX,
  lucideChartLine,
  lucideCoins,
} from '@ng-icons/lucide';
import { CommandAction, CommandPaletteService, SubPaletteId } from './command-palette.service';
import { ThemeService } from '../../services/theme.service';
import { AppToastService, ToastVariant } from '../../services/AppToast/app-toast.service';
import { CustomerDataService } from '../../../modules/customers/services/customer-data.service';
import { OrderService } from '../../../modules/orders/services/order.service';
import { SavingSchemesService } from '../../services/SavingSchemes/saving-schemes.service';
import { MetalRatesService } from '../../services/MetalRates/metal-rates.service';
import { PuritiesService } from '../../services/Purities/purities.service';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { Purity } from '../../../interfaces/Shared/purity';

interface RecentOrderRow {
  invoiceNumber: string;
  customerName: string;
  orderGuid: string;
}

interface Row {
  action: CommandAction;
  score: number;
}

interface Group {
  section: string;
  rows: Row[];
}

interface CustomerLite {
  customerGuid: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  fullName?: string;
}

interface CrumbFrame {
  id: SubPaletteId;
  title: string;
}

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideArrowRight,
      lucideChevronLeft,
      lucideCommand,
      lucideCornerDownLeft,
      lucideHammer,
      lucideLayoutDashboard,
      lucideMoon,
      lucidePackage,
      lucidePiggyBank,
      lucidePlus,
      lucideReceipt,
      lucideRefreshCcw,
      lucideSearch,
      lucideShoppingCart,
      lucideSun,
      lucideTag,
      lucideTags,
      lucideUser,
      lucideUserPlus,
      lucideUsers,
      lucideX,
      lucideChartLine,
      lucideCoins,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent implements OnInit, AfterViewInit {
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly customerService = inject(CustomerDataService);
  private readonly orderService = inject(OrderService);
  private readonly savingSchemes = inject(SavingSchemesService);
  private readonly metalRates = inject(MetalRatesService);
  private readonly purities = inject(PuritiesService);
  private readonly storeService = inject(StoreService);
  private readonly appToast = inject(AppToastService);
  readonly palette = inject(CommandPaletteService);

  readonly query = signal<string>('');
  readonly activeIndex = signal<number>(0);
  readonly recents = signal<RecentOrderRow[]>([]);
  readonly stack = signal<CrumbFrame[]>([]);

  readonly isMac = /Mac|iPhone|iPad|iPod/.test(typeof navigator !== 'undefined' ? navigator.platform : '');
  readonly commandHint = this.isMac ? '⌘K' : 'Ctrl+K';
  readonly rootPlaceholder = $localize`:@@palette.placeholder.root:Search or run command...`;
  readonly subPlaceholder = $localize`:@@palette.placeholder.sub:Fill in details...`;

  @ViewChild('searchInput') searchRef?: ElementRef<HTMLInputElement>;

  // Sub-palette state
  readonly customerForm = signal({ firstName: '', lastName: '', phoneNumber: '' });
  readonly customerPicker = signal<string>('');
  readonly customerMatches = signal<CustomerLite[]>([]);
  readonly pickedCustomer = signal<CustomerLite | null>(null);
  readonly schemeForm = signal({ planName: 'Golden Harvest', monthlyAmount: 5000, tenureMonths: 11 });
  readonly rateForm = signal<{ purityCode: string; ratePerGram: number }>({ purityCode: '', ratePerGram: 0 });
  readonly puritiesList = signal<Purity[]>([]);
  readonly submitting = signal<boolean>(false);

  private customerCache: CustomerLite[] = [];

  private readonly baseActions = computed<CommandAction[]>(() => this.buildActions(this.recents()));

  readonly currentSub = computed<SubPaletteId | null>(() => {
    const s = this.stack();
    return s.length ? s[s.length - 1].id : null;
  });

  readonly breadcrumbs = computed<string[]>(() => {
    return ['Home', ...this.stack().map((f) => f.title)];
  });

  readonly groups = computed<Group[]>(() => {
    if (this.currentSub()) { return []; }
    const q = this.query().trim().toLowerCase();
    const map = new Map<string, Row[]>();
    for (const a of this.baseActions()) {
      const score = this.match(a, q);
      if (score < 0) { continue; }
      const list = map.get(a.section) ?? [];
      list.push({ action: a, score });
      map.set(a.section, list);
    }
    const order = ['NAVIGATE', 'QUICK ACTIONS', 'RECENT'];
    const out: Group[] = [];
    for (const section of order) {
      const rows = map.get(section);
      if (!rows) { continue; }
      rows.sort((a, b) => a.score - b.score);
      out.push({ section, rows });
    }
    return out;
  });

  readonly flatRows = computed<Row[]>(() => {
    const out: Row[] = [];
    for (const g of this.groups()) { out.push(...g.rows); }
    return out;
  });

  constructor() {
    effect(() => {
      const isOpen = this.palette.isOpen();
      if (isOpen) {
        this.resetTransient();
        queueMicrotask(() => this.focusInput());
        void this.loadRecents();
      }
    });

    effect(() => {
      // Keep active row inside bounds whenever the flat list changes.
      const total = this.flatRows().length;
      if (this.activeIndex() >= total) {
        this.activeIndex.set(Math.max(0, total - 1));
      }
    });
  }

  ngOnInit(): void {
    void this.purities.getPurities().then((rows) => this.puritiesList.set(rows));
  }

  ngAfterViewInit(): void {
    if (this.palette.isOpen()) { this.focusInput(); }
  }

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  onGlobalOpen(evt: Event): void {
    evt.preventDefault();
    if (!this.palette.isOpen()) { this.palette.open(); }
    queueMicrotask(() => this.focusInput());
  }

  onSearchChange(v: string): void {
    this.query.set(v);
    this.activeIndex.set(0);
  }

  onBackdropClick(): void {
    this.palette.close();
  }

  onCloseClick(): void {
    this.palette.close();
  }

  onBackClick(): void {
    this.popFrame();
  }

  onSearchKeydown(evt: KeyboardEvent): void {
    if (evt.key === 'Escape') {
      evt.preventDefault();
      if (this.currentSub()) { this.popFrame(); } else { this.palette.close(); }
      return;
    }
    if (this.currentSub()) { return; }
    const rows = this.flatRows();
    if (evt.key === 'ArrowDown') {
      evt.preventDefault();
      if (!rows.length) { return; }
      this.activeIndex.set((this.activeIndex() + 1) % rows.length);
      this.scrollActiveIntoView();
    } else if (evt.key === 'ArrowUp') {
      evt.preventDefault();
      if (!rows.length) { return; }
      this.activeIndex.set((this.activeIndex() - 1 + rows.length) % rows.length);
      this.scrollActiveIntoView();
    } else if (evt.key === 'Enter') {
      evt.preventDefault();
      const row = rows[this.activeIndex()];
      if (row) { this.runAction(row.action); }
    }
  }

  onRowHover(idx: number): void {
    this.activeIndex.set(idx);
  }

  onRowClick(action: CommandAction): void {
    this.runAction(action);
  }

  isActive(row: Row): boolean {
    const rows = this.flatRows();
    return rows[this.activeIndex()]?.action.id === row.action.id;
  }

  // Sub-palette handlers
  async onSubmitCustomer(): Promise<void> {
    const f = this.customerForm();
    if (!f.firstName.trim() || !f.phoneNumber.trim()) {
      this.toast('warning', 'First name and phone are required');
      return;
    }
    this.submitting.set(true);
    try {
      await this.customerService.addCustomer({
        firstName: f.firstName.trim(),
        lastName: (f.lastName ?? '').trim(),
        dateOfBirth: new Date().toISOString().slice(0, 10),
        gender: 'other',
        address: null,
        city: null,
        email: null,
        phoneNumber: f.phoneNumber.trim(),
        gstin: null,
        pan: null,
        remarks: null,
        imagePath: null,
      });
      this.toast('success', `Customer ${f.firstName.trim()} added`);
      this.palette.close();
    } catch (err) {
      this.toast('error', `Could not add customer: ${this.errText(err)}`);
    } finally {
      this.submitting.set(false);
    }
  }

  async onCustomerPickerInput(v: string): Promise<void> {
    this.customerPicker.set(v);
    this.pickedCustomer.set(null);
    if (!v || v.trim().length < 2) {
      this.customerMatches.set([]);
      return;
    }
    try {
      if (!this.customerCache.length) {
        const rows = await this.customerService.getAllCustomers(false, 200, 1, '', true);
        this.customerCache = this.normaliseCustomers(rows);
      }
      const q = v.trim().toLowerCase();
      const filtered = this.customerCache
        .filter((c) => {
          const full = ((c.firstName ?? '') + ' ' + (c.lastName ?? '')).toLowerCase();
          const phone = (c.phoneNumber ?? '').toLowerCase();
          return full.includes(q) || phone.includes(q);
        })
        .slice(0, 5);
      this.customerMatches.set(filtered);
    } catch {
      this.customerMatches.set([]);
    }
  }

  pickCustomer(c: CustomerLite): void {
    this.pickedCustomer.set(c);
    this.customerPicker.set(((c.firstName ?? '') + ' ' + (c.lastName ?? '')).trim());
    this.customerMatches.set([]);
  }

  async onSubmitScheme(): Promise<void> {
    const picked = this.pickedCustomer();
    if (!picked) {
      this.toast('warning', 'Pick a customer first');
      return;
    }
    const f = this.schemeForm();
    if (!f.planName.trim() || !f.monthlyAmount || !f.tenureMonths) {
      this.toast('warning', 'Fill in plan, amount, tenure');
      return;
    }
    this.submitting.set(true);
    try {
      const uid = await this.currentActorUid();
      await this.savingSchemes.enroll({
        customerGuid: picked.customerGuid,
        planName: f.planName.trim(),
        monthlyAmount: Number(f.monthlyAmount),
        tenureMonths: Number(f.tenureMonths),
        bonusInstallments: 1,
        actorUserId: uid,
      });
      this.toast('success', 'Saving scheme enrolled');
      this.palette.close();
    } catch (err) {
      this.toast('error', `Could not enroll scheme: ${this.errText(err)}`);
    } finally {
      this.submitting.set(false);
    }
  }

  onRateFormChange(field: 'purityCode' | 'ratePerGram', v: string): void {
    const cur = this.rateForm();
    if (field === 'purityCode') {
      this.rateForm.set({ ...cur, purityCode: v });
    } else {
      this.rateForm.set({ ...cur, ratePerGram: Number(v) || 0 });
    }
  }

  onCustomerFieldChange(field: 'firstName' | 'lastName' | 'phoneNumber', v: string): void {
    const cur = this.customerForm();
    this.customerForm.set({ ...cur, [field]: v });
  }

  onSchemeFieldChange(field: 'planName' | 'monthlyAmount' | 'tenureMonths', v: string): void {
    const cur = this.schemeForm();
    if (field === 'planName') {
      this.schemeForm.set({ ...cur, planName: v });
    } else {
      this.schemeForm.set({ ...cur, [field]: Number(v) || 0 });
    }
  }

  async onSubmitRate(): Promise<void> {
    const f = this.rateForm();
    if (!f.purityCode || !f.ratePerGram) {
      this.toast('warning', 'Pick a purity and enter a rate');
      return;
    }
    this.submitting.set(true);
    try {
      const uid = await this.currentActorUid();
      const now = new Date();
      const effectiveDate = now.toISOString().slice(0, 10);
      const istHour = (now.getUTCHours() + 5) + ((now.getUTCMinutes() + 30) >= 60 ? 1 : 0);
      const normalisedHour = ((istHour % 24) + 24) % 24;
      const session: 'AM' | 'PM' = normalisedHour < 14 ? 'AM' : 'PM';
      await this.metalRates.save({
        effectiveDate,
        session,
        source: 'manual',
        setByUserId: uid,
        rates: [{ purityCode: f.purityCode, ratePerGram: f.ratePerGram }],
      });
      this.toast('success', `Rate locked for ${f.purityCode} (${session})`);
      this.palette.close();
    } catch (err) {
      this.toast('error', `Could not save rate: ${this.errText(err)}`);
    } finally {
      this.submitting.set(false);
    }
  }

  private buildActions(recents: RecentOrderRow[]): CommandAction[] {
    const nav: CommandAction[] = [
      { id: 'nav-today',    section: 'NAVIGATE', kind: 'nav', label: 'Today',                  route: '/dashboard',      icon: 'lucideLayoutDashboard', shortcut: 'Ctrl+G T', keywords: 'dashboard home' },
      { id: 'nav-sell',     section: 'NAVIGATE', kind: 'nav', label: 'Sell (new invoice)',     route: '/orders/prepare-order', icon: 'lucideShoppingCart',    shortcut: 'Ctrl+G S', keywords: 'order invoice new' },
      { id: 'nav-stock',    section: 'NAVIGATE', kind: 'nav', label: 'Stock',                  route: '/inventory',      icon: 'lucidePackage',         shortcut: 'Ctrl+G K', keywords: 'inventory products' },
      { id: 'nav-people',   section: 'NAVIGATE', kind: 'nav', label: 'People',                 route: '/customers',      icon: 'lucideUsers',           shortcut: 'Ctrl+G P', keywords: 'customers' },
      { id: 'nav-catalog',  section: 'NAVIGATE', kind: 'nav', label: 'Catalog',                route: '/categories',     icon: 'lucideTags',            shortcut: 'Ctrl+G C', keywords: 'categories' },
      { id: 'nav-schemes',  section: 'NAVIGATE', kind: 'nav', label: 'Schemes',                route: '/saving-schemes', icon: 'lucidePiggyBank',       shortcut: 'Ctrl+G H', keywords: 'saving scheme' },
      { id: 'nav-karigar',  section: 'NAVIGATE', kind: 'nav', label: 'Karigar',                route: '/karigar',        icon: 'lucideHammer',          shortcut: 'Ctrl+G R', keywords: 'karigar goldsmith job' },
      { id: 'nav-reports',  section: 'NAVIGATE', kind: 'nav', label: 'Reports',                route: '/reports',        icon: 'lucideChartLine',       shortcut: 'Ctrl+G B', keywords: 'day book gst stock' },
    ];

    const quick: CommandAction[] = [
      { id: 'act-add-customer',  section: 'QUICK ACTIONS', kind: 'sub',      label: 'Add customer...',        icon: 'lucideUserPlus',   sub: 'add-customer',   keywords: 'new customer' },
      { id: 'act-add-product',   section: 'QUICK ACTIONS', kind: 'nav',      label: 'Add product...',         icon: 'lucideTag',        route: '/inventory',   keywords: 'new product sku' },
      { id: 'act-new-invoice',   section: 'QUICK ACTIONS', kind: 'nav',      label: 'New invoice',            icon: 'lucideReceipt',    route: '/orders/prepare-order', keywords: 'sell order' },
      { id: 'act-enroll-scheme', section: 'QUICK ACTIONS', kind: 'sub',      label: 'Enroll saving scheme...',icon: 'lucidePiggyBank',  sub: 'enroll-scheme',  keywords: 'golden harvest' },
      { id: 'act-issue-job',     section: 'QUICK ACTIONS', kind: 'nav',      label: 'Issue karigar job...',   icon: 'lucideHammer',     route: '/karigar/jobs/new', keywords: 'goldsmith' },
      { id: 'act-toggle-theme',  section: 'QUICK ACTIONS', kind: 'callback', label: 'Toggle theme',           icon: this.themeService.isDark() ? 'lucideSun' : 'lucideMoon', run: () => this.themeService.toggle(), keywords: 'dark light mode' },
      { id: 'act-lock-rate',     section: 'QUICK ACTIONS', kind: 'sub',      label: "Lock today's rate...",   icon: 'lucideCoins',      sub: 'lock-rate',      keywords: 'metal gold rate' },
    ];

    const recent: CommandAction[] = recents.map((r) => ({
      id: `recent-${r.orderGuid}`,
      section: 'RECENT',
      kind: 'recent',
      label: `${r.invoiceNumber} — ${r.customerName}`,
      icon: 'lucideReceipt',
      route: ['/orders/view-order-details', r.orderGuid],
    }));

    return [...nav, ...quick, ...recent];
  }

  private runAction(a: CommandAction): void {
    if (a.kind === 'nav' || a.kind === 'recent') {
      if (Array.isArray(a.route)) {
        void this.router.navigate(a.route);
      } else if (a.route) {
        void this.router.navigateByUrl(a.route);
      }
      this.palette.close();
      return;
    }
    if (a.kind === 'callback' && a.run) {
      void a.run();
      this.palette.close();
      return;
    }
    if (a.kind === 'sub' && a.sub) {
      this.pushFrame(a.sub, a.label.replace(/\.\.\.$/, ''));
      return;
    }
  }

  private pushFrame(id: SubPaletteId, title: string): void {
    this.stack.set([...this.stack(), { id, title }]);
    this.query.set('');
    queueMicrotask(() => this.focusInput());
  }

  private popFrame(): void {
    const s = this.stack();
    if (!s.length) {
      this.palette.close();
      return;
    }
    this.stack.set(s.slice(0, -1));
    this.query.set('');
    queueMicrotask(() => this.focusInput());
  }

  private resetTransient(): void {
    this.query.set('');
    this.activeIndex.set(0);
    this.stack.set([]);
    this.customerForm.set({ firstName: '', lastName: '', phoneNumber: '' });
    this.customerPicker.set('');
    this.customerMatches.set([]);
    this.pickedCustomer.set(null);
    this.schemeForm.set({ planName: 'Golden Harvest', monthlyAmount: 5000, tenureMonths: 11 });
    const rates = this.metalRates.rates();
    const first = rates[0];
    this.rateForm.set({
      purityCode: first?.purityCode ?? '916',
      ratePerGram: first?.ratePerGram ?? 0,
    });
    this.submitting.set(false);
  }

  private focusInput(): void {
    try { this.searchRef?.nativeElement.focus(); } catch { /* not yet in DOM */ }
  }

  private scrollActiveIntoView(): void {
    queueMicrotask(() => {
      const el = document.querySelector('.cp-row.is-active');
      if (el && typeof (el as any).scrollIntoView === 'function') {
        (el as HTMLElement).scrollIntoView({ block: 'nearest' });
      }
    });
  }

  private async loadRecents(): Promise<void> {
    try {
      const rows: any = await this.orderService.getAllOrders(5, 1, '');
      const list = this.pickRows(rows).slice(0, 5).map((r: any): RecentOrderRow => ({
        invoiceNumber: r.invoiceNumber ?? r.orderNumber ?? r.invoiceNo ?? r.orderGuid,
        customerName: [r.firstName, r.lastName].filter(Boolean).join(' ') || r.customerName || 'Customer',
        orderGuid: r.orderGuid ?? r.invoiceGuid ?? r.guid,
      })).filter((r: RecentOrderRow) => !!r.orderGuid);
      this.recents.set(list);
    } catch {
      this.recents.set([]);
    }
  }

  private pickRows(raw: any): any[] {
    if (!raw) { return []; }
    if (Array.isArray(raw)) {
      const first = raw[0];
      if (Array.isArray(first)) { return first; }
      return raw;
    }
    return [];
  }

  private normaliseCustomers(raw: any): CustomerLite[] {
    const rows = this.pickRows(raw);
    return rows
      .filter((r: any) => r && r.customerGuid)
      .map((r: any) => ({
        customerGuid: r.customerGuid,
        firstName: r.firstName,
        lastName: r.lastName,
        phoneNumber: r.phoneNumber ?? r.phone,
      }));
  }

  private async currentActorUid(): Promise<number | null> {
    try {
      const authData: any = await this.storeService.get('authData');
      return authData?.uid ? Number(authData.uid) : null;
    } catch { return null; }
  }

  private match(a: CommandAction, q: string): number {
    if (!q) { return 100; }
    const hay = `${a.label} ${a.description ?? ''} ${a.section} ${a.keywords ?? ''}`.toLowerCase();
    q = q.toLowerCase();
    const idx = hay.indexOf(q);
    if (idx >= 0) {
      // shorter distance to start = better score; smaller number = higher priority
      return idx;
    }
    // subsequence fallback: every char of q must appear in order
    let hi = 0;
    let matched = 0;
    let firstMatchIdx = -1;
    for (let qi = 0; qi < q.length; qi++) {
      const c = q[qi];
      const found = hay.indexOf(c, hi);
      if (found < 0) { return -1; }
      if (firstMatchIdx < 0) { firstMatchIdx = found; }
      hi = found + 1;
      matched++;
    }
    if (matched !== q.length) { return -1; }
    return 500 + firstMatchIdx;
  }

  private toast(icon: ToastVariant, title: string): void {
    this.appToast.show({ variant: icon, title, position: 'top-end', timer: icon === 'error' ? 3600 : 2400 });
  }

  private errText(err: unknown): string {
    if (!err) { return 'unknown error'; }
    if (typeof err === 'string') { return err; }
    const anyErr = err as any;
    return anyErr?.message ?? String(err);
  }
}
