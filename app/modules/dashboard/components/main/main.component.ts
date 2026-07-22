import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import type { Chart as ChartType, ChartConfiguration } from 'chart.js';
import dayjs from 'dayjs';

import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { OrderService } from '../../../orders/services/order.service';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { RecentOrdersModel } from '../../models/recent-orders-model';
import { MonthlySalesAndLabourModel, SalesAndLabourModel } from '../../models/sales-and-labour-model';
import { TotalCustomersModel } from '../../models/total-customers-model';
import { TotalStockModel } from '../../models/total-stock-model';
import { TotalRevenueModel } from '../../models/total-revenue-model';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideTrendingUp,
  lucideTrendingDown,
  lucideArrowRight,
  lucideLock,
  lucideInbox,
  lucideChartLine,
  lucideGem,
  lucideUsers,
  lucidePackage,
  lucideWallet,
} from '@ng-icons/lucide';

import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { ProductCategoryService } from '../../../categories/components/product-categories/services/product-category.service';
import { MetalRateRow } from '../../../../interfaces/Shared/metal-rate';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
      lucideTrendingUp,
      lucideTrendingDown,
      lucideArrowRight,
      lucideLock,
      lucideInbox,
      lucideChartLine,
      lucideGem,
      lucideUsers,
      lucidePackage,
      lucideWallet,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart: ChartType | null = null;
  private chartCtor: typeof ChartType | null = null;
  private themeObserver: MutationObserver | null = null;

  private readonly customerService = inject(CustomerDataService);
  private readonly inventoryService = inject(InventoryService);
  private readonly ordersService = inject(OrderService);
  private readonly productCategoryService = inject(ProductCategoryService);
  private readonly metalRatesService = inject(MetalRatesService);
  private readonly logger = inject(LoggerService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  today = dayjs().format('ddd D MMM YYYY');

  monthlySales: MonthlySalesAndLabourModel[] = [];
  revenueTotal: number | null = null;
  revenueDelta: number | null = null;

  rate22k: number | null = null;
  ratesLoaded = false;

  recentOrders: RecentOrdersModel[] = [];
  recentOrdersLoaded = false;

  fastMovers: TopProductCategoriesModel[] = [];
  fastMoversLoaded = false;

  totalCustomers: number | null = null;
  customersDelta: number | null = null;

  totalStockGrams: number | null = null;
  stockDelta: number | null = null;

  pendingCount: number | null = null;
  pendingAmount: number | null = null;
  pendingLoaded = false;

  ngOnInit(): void {
    this.loadRevenue();
    this.loadRates();
    this.loadRecentOrders();
    this.loadFastMovers();
    this.loadCustomers();
    this.loadStock();
    this.loadPending();
  }

  ngAfterViewInit(): void {
    this.themeObserver = new MutationObserver(() => {
      if (this.monthlySales.length) { this.scheduleChartRender(); }
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    // The <canvas> lives inside an @if (monthlySales.length) branch. If the
    // revenue data already landed before ngAfterViewInit fired, schedule a
    // render now.
    if (this.monthlySales.length) { this.scheduleChartRender(); }
  }

  private async ensureChart(): Promise<typeof ChartType> {
    if (this.chartCtor) { return this.chartCtor; }
    const mod = await import('chart.js/auto');
    this.chartCtor = mod.default;
    return this.chartCtor;
  }

  private scheduleChartRender(): void {
    // Defer past the current Angular tick so the OnPush change detection can
    // materialise <canvas #revenueChart> before we look it up via ViewChild.
    // setTimeout(0) reliably fires after the change-detection macrotask.
    setTimeout(() => { void this.renderChart(); }, 0);
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
    this.themeObserver?.disconnect();
    this.themeObserver = null;
  }

  trackByOrder = (_: number, o: RecentOrdersModel) => o.invoiceGuid ?? o.id;
  trackByMover = (_: number, m: TopProductCategoriesModel) => m.productCategoryName;

  formatINR(value: number | null | undefined): string {
    const n = Number(value ?? 0);
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);
  }

  formatNumber(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN').format(Number(value ?? 0));
  }

  customerName(o: RecentOrdersModel): string {
    const cd = o.customerDetails ?? o.customer_details;
    if (!cd) { return 'Walk-in'; }
    const parts = [cd.firstName, cd.lastName].filter(Boolean);
    return parts.join(' ').trim() || 'Walk-in';
  }

  goToLockRate(): void {
    this.router.navigate(['/settings']);
  }

  private async loadRevenue(): Promise<void> {
    try {
      const resp: TotalRevenueModel[] = await this.ordersService.getTotalRevenueInLast6Months();
      const first = Array.isArray(resp) ? resp[0] : resp;
      if (first) {
        this.revenueTotal = Number(first.total ?? 0);
        this.revenueDelta = Number(first.percent_increase ?? 0);
      }
      const sla: SalesAndLabourModel[] = await this.ordersService.getSalesAndLabour(6);
      if (sla?.[0]?.monthlySalesAndLabour) {
        this.monthlySales = [...sla[0].monthlySalesAndLabour];
      }
      // markForCheck first so the @if branch renders the <canvas>;
      // then defer chart creation past the Angular tick so the ViewChild
      // has a chance to resolve to the freshly-instantiated canvas.
      this.cdr.markForCheck();
      if (this.monthlySales.length) {
        this.scheduleChartRender();
      }
    } catch (err) {
      this.logger.LogError(err, 'MainComponent#loadRevenue');
    }
  }

  private async loadRates(): Promise<void> {
    try {
      const rows: MetalRateRow[] = await this.metalRatesService.getCurrent();
      const preferred = rows.find(r => r.purityCode === '916' && r.session === 'PM')
        ?? rows.find(r => r.purityCode === '916')
        ?? null;
      this.rate22k = preferred ? Number(preferred.ratePerGram) : null;
      this.ratesLoaded = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.ratesLoaded = true;
      this.logger.LogError(err, 'MainComponent#loadRates');
    }
  }

  private async loadRecentOrders(): Promise<void> {
    try {
      const orders = await this.ordersService.getRecentOrders(5);
      this.recentOrders = Array.isArray(orders) ? orders.slice(0, 5) : [];
      this.recentOrdersLoaded = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.recentOrdersLoaded = true;
      this.logger.LogError(err, 'MainComponent#loadRecentOrders');
    }
  }

  private async loadFastMovers(): Promise<void> {
    try {
      const rows: TopProductCategoriesModel[] = await this.productCategoryService.getTopProductCategories();
      this.fastMovers = (rows ?? []).slice(0, 5);
      this.fastMoversLoaded = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.fastMoversLoaded = true;
      this.logger.LogError(err, 'MainComponent#loadFastMovers');
    }
  }

  private async loadCustomers(): Promise<void> {
    try {
      const resp: TotalCustomersModel[] = await this.customerService.getTotalCustomers();
      const first = Array.isArray(resp) ? resp[0] : resp;
      if (first) {
        this.totalCustomers = Number(first.total ?? 0);
        this.customersDelta = Number(first.percent_increase ?? 0);
      }
      this.cdr.markForCheck();
    } catch (err) {
      this.logger.LogError(err, 'MainComponent#loadCustomers');
    }
  }

  private async loadStock(): Promise<void> {
    try {
      const resp: TotalStockModel[] = await this.inventoryService.getTotalStock();
      const first = Array.isArray(resp) ? resp[0] : resp;
      if (first) {
        this.totalStockGrams = Number(first.total ?? 0);
        this.stockDelta = Number(first.percent_increase ?? 0);
      }
      this.cdr.markForCheck();
    } catch (err) {
      this.logger.LogError(err, 'MainComponent#loadStock');
    }
  }

  /**
   * No dedicated pending-payments SP exists yet. Derive from get_all_orders
   * (first page, page size 500) by filtering isPaymentDone=false. Zero
   * is a legitimate value; we distinguish "loaded but empty" vs "not loaded".
   */
  private async loadPending(): Promise<void> {
    try {
      const resp: any = await this.ordersService.getAllOrders(500, 1, '');
      const rows: any[] = Array.isArray(resp?.[0]) ? resp[0] : Array.isArray(resp) ? resp : [];
      const pending = rows.filter(r => !r.isPaymentDone && !r.cancelledAt);
      this.pendingCount = pending.length;
      this.pendingAmount = pending.reduce((sum, r) => sum + Number(r.grandTotal ?? r.totalAmountWithGst ?? 0), 0);
      this.pendingLoaded = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.pendingLoaded = true;
      this.logger.LogError(err, 'MainComponent#loadPending');
    }
  }

  private async renderChart(): Promise<void> {
    if (!this.monthlySales.length) { return; }
    // If the OnPush pass hasn't materialised the canvas yet, run one more
    // detectChanges + micro-defer to give it a chance.
    if (!this.chartCanvas) {
      this.cdr.detectChanges();
      await new Promise<void>(res => setTimeout(res, 0));
    }
    if (!this.chartCanvas) { return; }
    const ChartCtor = await this.ensureChart();
    if (!this.chartCanvas) { return; }
    this.chart?.destroy();

    const styles = getComputedStyle(document.documentElement);
    const fgMuted = styles.getPropertyValue('--color-fg-muted').trim() || '#63635e';
    const border = styles.getPropertyValue('--color-border-subtle').trim() || '#e9e8e6';
    const panel = styles.getPropertyValue('--color-panel').trim() || '#fff';
    const accent = 'oklch(72% 0.14 65)';

    const labels = this.monthlySales.map(m => m.month_year);
    const data = this.monthlySales.map(m => Number(m.sales) || 0);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue',
          data,
          borderColor: accent,
          backgroundColor: this.buildGradient(accent),
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: accent,
          pointBorderColor: panel,
          fill: true,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: panel,
            titleColor: styles.getPropertyValue('--color-fg').trim() || '#21201c',
            bodyColor: fgMuted,
            borderColor: border,
            borderWidth: 1,
            padding: 12,
            usePointStyle: true,
            titleFont: { family: 'Inter, Hind, system-ui, sans-serif', weight: 600 },
            bodyFont: { family: 'Inter, Hind, system-ui, sans-serif' },
            callbacks: {
              label: (ctx) => ` ${this.formatINR(Number(ctx.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { color: border, display: true },
            ticks: { color: fgMuted, font: { family: 'Inter, Hind, system-ui, sans-serif', size: 11 } },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: { display: false },
          },
        },
      },
    };

    this.chart = new ChartCtor(this.chartCanvas.nativeElement, config);
  }

  private buildGradient(color: string): CanvasGradient | string {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) { return color; }
    const ctx = canvas.getContext('2d');
    if (!ctx) { return color; }
    const gradient = ctx.createLinearGradient(0, 0, 0, 240);
    gradient.addColorStop(0, 'color-mix(in oklab, oklch(72% 0.14 65) 8%, transparent)');
    gradient.addColorStop(1, 'color-mix(in oklab, oklch(72% 0.14 65) 0%, transparent)');
    return gradient;
  }
}
