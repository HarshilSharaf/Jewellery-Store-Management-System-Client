import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { Chart, ChartConfiguration } from 'chart.js/auto';
import { NgxUiLoaderService } from 'ngx-ui-loader';

import { ProductCategoryService } from '../../../categories/components/product-categories/services/product-category.service';
import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { OrderService } from '../../../orders/services/order.service';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { RecentOrdersModel } from '../../models/recent-orders-model';
import { MonthlySalesAndLabourModel, SalesAndLabourModel } from '../../models/sales-and-labour-model';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';
import { TotalCustomersModel } from '../../models/total-customers-model';
import { TotalStockModel } from '../../models/total-stock-model';
import { TotalRevenueModel } from '../../models/total-revenue-model';

import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideIndianRupee,
  lucidePackage,
  lucideUsers,
  lucideTrendingUp,
  lucideTrendingDown,
  lucideChartLine,
  lucideArrowRight,
  lucideGem,
} from '@ng-icons/lucide';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ThemeService } from '../../../../shared/services/theme.service';
import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { MetalRateRow } from '../../../../interfaces/Shared/metal-rate';

type DashboardKpiSlot = 'revenue' | 'stock' | 'customers';

interface Kpi {
  slot: DashboardKpiSlot;
  label: string;
  value: string;
  sublabel: string;
  delta: number;
  icon: string;
  format?: 'currency' | 'weight' | 'count';
}

interface LiveRate {
  purity: string;
  purityCode: string;
  ratePerGram: number;
  session: 'AM' | 'PM';
  changePct: number;
  metalType?: string;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, PageHeaderComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucideIndianRupee,
      lucidePackage,
      lucideUsers,
      lucideTrendingUp,
      lucideTrendingDown,
      lucideChartLine,
      lucideArrowRight,
      lucideGem,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('salesLineChart', { static: false }) chartCanvas?: ElementRef<HTMLCanvasElement>;

  private chart: Chart | null = null;
  private kpiSlots: Partial<Record<DashboardKpiSlot, Kpi>> = {};
  private themeAttrObserver: MutationObserver | null = null;

  recentOrders: RecentOrdersModel[] = [];
  topSellingProducts: TopProductCategoriesModel[] = [];
  monthlySalesAndLabour: MonthlySalesAndLabourModel[] = [];

  liveRates: LiveRate[] = [];
  liveRatesLoaded = false;
  liveRatesSession: 'AM' | 'PM' = 'AM';

  get kpis(): Kpi[] {
    return (['revenue', 'stock', 'customers'] as DashboardKpiSlot[])
      .map(k => this.kpiSlots[k])
      .filter((c): c is Kpi => c !== undefined);
  }

  constructor(
    private customerService: CustomerDataService,
    private inventoryService: InventoryService,
    private ordersService: OrderService,
    private productCategoryService: ProductCategoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private themeService: ThemeService,
    private metalRatesService: MetalRatesService
  ) {}

  ngOnInit() {
    this.getTotalRevenueInLast6Months();
    this.getTotalStock();
    this.getTotalCustomers();
    this.getRecentOrders();
    this.getTopProductCategories();
    this.getSalesAndLabour();
    this.loadLiveRates();
  }

  ngAfterViewInit(): void {
    this.themeAttrObserver = new MutationObserver(() => {
      if (this.monthlySalesAndLabour.length) {
        this.renderChart();
      }
    });
    this.themeAttrObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
    this.themeAttrObserver?.disconnect();
    this.themeAttrObserver = null;
    this.loaderService.stop();
  }

  trackByPurity = (_: number, r: LiveRate) => r.purity;
  trackByProduct = (_: number, p: TopProductCategoriesModel) => p.productCategoryName;
  trackByOrder = (_: number, o: RecentOrdersModel) => o.invoiceGuid ?? o.id;

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);
  }

  formatNumber(v: number): string {
    return new Intl.NumberFormat('en-IN').format(v);
  }

  customerFullName(o: RecentOrdersModel): string {
    const cd = o.customerDetails ?? o.customer_details;
    const first = cd?.firstName ?? '';
    const last = cd?.lastName ?? '';
    return `${first} ${last}`.trim();
  }

  orderTotal(o: RecentOrdersModel): number {
    return Number(o.grandTotal ?? o.totalAmountWithGst ?? 0);
  }

  orderItemCount(o: RecentOrdersModel): number {
    return Number(o.totalLineItems ?? o.total_products ?? 0);
  }

  private renderChart(): void {
    if (!this.chartCanvas || !this.monthlySalesAndLabour.length) return;
    this.chart?.destroy();

    const styles = getComputedStyle(document.documentElement);
    const accent = styles.getPropertyValue('--color-accent').trim() || '#ffc53d';
    const fg = styles.getPropertyValue('--color-fg').trim() || '#21201c';
    const fgMuted = styles.getPropertyValue('--color-fg-muted').trim() || '#63635e';
    const border = styles.getPropertyValue('--color-border').trim() || '#dad9d6';

    const labels = this.monthlySalesAndLabour.map(m => m.month_year);
    const data = this.monthlySalesAndLabour.map(m => Number(m.sales) || 0);

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Sales',
          data,
          borderColor: accent,
          backgroundColor: this.buildGradient(accent),
          borderWidth: 2,
          tension: 0.35,
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: accent,
          pointBorderColor: styles.getPropertyValue('--color-panel').trim() || '#fff',
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
            backgroundColor: styles.getPropertyValue('--color-panel').trim() || '#fff',
            titleColor: fg,
            bodyColor: fgMuted,
            borderColor: border,
            borderWidth: 1,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { family: 'Inter, Hind, system-ui, sans-serif', weight: 600 },
            bodyFont: { family: 'Inter, Hind, system-ui, sans-serif' },
            callbacks: {
              label: (ctx) => ` ${this.formatCurrency(Number(ctx.parsed.y ?? 0))}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            border: { display: false },
            ticks: { color: fgMuted, font: { family: 'Inter, Hind, system-ui, sans-serif', size: 12 } },
          },
          y: {
            grid: { color: border, tickLength: 0 },
            border: { display: false },
            ticks: {
              color: fgMuted,
              font: { family: 'Inter, Hind, system-ui, sans-serif', size: 12 },
              callback: (v) => this.formatNumber(Number(v)),
            },
          },
        },
      },
    };

    this.chart = new Chart(this.chartCanvas.nativeElement, config);
  }

  private buildGradient(color: string): CanvasGradient | string {
    const canvas = this.chartCanvas?.nativeElement;
    if (!canvas) return color;
    const ctx = canvas.getContext('2d');
    if (!ctx) return color;
    const gradient = ctx.createLinearGradient(0, 0, 0, 280);
    gradient.addColorStop(0, this.hexToRgba(color, 0.28));
    gradient.addColorStop(1, this.hexToRgba(color, 0));
    return gradient;
  }

  private hexToRgba(color: string, alpha: number): string {
    const trimmed = color.trim();
    if (trimmed.startsWith('#') && (trimmed.length === 7 || trimmed.length === 4)) {
      const hex = trimmed.length === 4
        ? '#' + trimmed.slice(1).split('').map(c => c + c).join('')
        : trimmed;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    }
    return trimmed;
  }

  async getSalesAndLabour() {
    try {
      this.loggerService.LogInfo('getSalesAndLabour() Request Started.');
      const response: SalesAndLabourModel[] = await this.ordersService.getSalesAndLabour();
      if (response[0].monthlySalesAndLabour) {
        this.monthlySalesAndLabour = [...response[0].monthlySalesAndLabour];
        this.renderChart();
      }
      this.loggerService.LogInfo('getSalesAndLabour() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getSalesAndLabour()');
    }
  }

  async getTopProductCategories() {
    try {
      this.loggerService.LogInfo('getTopProductCategories() Request Started.');
      const response: TopProductCategoriesModel[] = await this.productCategoryService.getTopProductCategories();
      this.topSellingProducts = response;
      this.loggerService.LogInfo('getTopProductCategories() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getTopProductCategories()');
    }
  }

  async getRecentOrders() {
    try {
      this.loggerService.LogInfo('getRecentOrders() Request Started.');
      if (this.loaderService.getLoader()) {
        this.loaderService.start();
      }
      const response: any = await this.ordersService.getRecentOrders();
      this.recentOrders = [...response];
      this.loaderService.stop();
      this.loggerService.LogInfo('getRecentOrders() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getRecentOrders()');
      this.loaderService.stop();
    }
  }

  async getTotalCustomers() {
    try {
      this.loggerService.LogInfo('getTotalCustomers() Request Started.');
      this.loaderService.start();
      const response: TotalCustomersModel[] = await this.customerService.getTotalCustomers();
      this.loaderService.stop();
      this.kpiSlots.customers = {
        slot: 'customers',
        label: 'Customers',
        value: this.formatNumber(response[0].total ?? 0),
        sublabel: 'active last 6 months',
        delta: response[0].percent_increase ?? 0,
        icon: 'lucideUsers',
        format: 'count',
      };
      this.loggerService.LogInfo('getTotalCustomers() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getTotalCustomers()');
    }
  }

  async getTotalStock() {
    try {
      this.loggerService.LogInfo('getTotalStock() Request Started.');
      this.loaderService.start();
      const response: TotalStockModel[] = await this.inventoryService.getTotalStock();
      this.loaderService.stop();
      const total = response[0].total ?? 0;
      this.kpiSlots.stock = {
        slot: 'stock',
        label: 'Stock on hand',
        value: this.formatNumber(total),
        sublabel: 'gms of metal',
        delta: response[0].percent_increase ?? 0,
        icon: 'lucidePackage',
        format: 'weight',
      };
      this.loggerService.LogInfo('getTotalStock() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getTotalStock()');
    }
  }

  async loadLiveRates() {
    try {
      this.loggerService.LogInfo('loadLiveRates() Request Started.');
      const rows: MetalRateRow[] = await this.metalRatesService.getCurrent();
      this.liveRates = rows.map((r) => this.toLiveRate(r));
      if (rows.length && rows[0].session) {
        this.liveRatesSession = rows[0].session;
      }
      this.liveRatesLoaded = true;
      this.loggerService.LogInfo('loadLiveRates() Request Completed.');
    } catch (error) {
      this.liveRatesLoaded = true;
      this.loggerService.LogError(error, 'loadLiveRates()');
    }
  }

  private toLiveRate(row: MetalRateRow): LiveRate {
    return {
      purity: row.purityLabel ?? row.purityCode,
      purityCode: row.purityCode,
      ratePerGram: Number(row.ratePerGram) || 0,
      session: row.session,
      changePct: 0,
      metalType: row.metalType,
    };
  }

  async getTotalRevenueInLast6Months() {
    try {
      this.loggerService.LogInfo('getTotalRevenueInLast6Months() Request Started.');
      this.loaderService.start();
      const response: TotalRevenueModel[] = await this.ordersService.getTotalRevenueInLast6Months();
      this.loaderService.stop();
      this.kpiSlots.revenue = {
        slot: 'revenue',
        label: 'Revenue',
        value: this.formatCurrency(response[0].total ?? 0),
        sublabel: 'trailing 6 months',
        delta: response[0].percent_increase ?? 0,
        icon: 'lucideIndianRupee',
        format: 'currency',
      };
      this.loggerService.LogInfo('getTotalRevenueInLast6Months() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getTotalRevenueInLast6Months()');
    }
  }
}
