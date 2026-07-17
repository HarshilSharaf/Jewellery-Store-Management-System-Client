import { Component, OnDestroy, OnInit } from '@angular/core';

type DashboardCardSlot = 'revenue' | 'stock' | 'customers';

import { Chart } from 'chart.js';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProductCategoryService } from '../../../categories/components/product-categories/services/product-category.service';
import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { InventoryService } from '../../../inventory/services/inventory.service';
import { OrderService } from '../../../orders/services/order.service';
import { InfoCardData } from '../../../../shared/models/infoCardData';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { RecentOrdersModel } from '../../models/recent-orders-model';
import { MonthlySalesAndLabourModel, SalesAndLabourModel } from '../../models/sales-and-labour-model';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';
import { TotalCustomersModel } from '../../models/total-customers-model';
import { TotalStockModel } from '../../models/total-stock-model';
import { TotalRevenueModel } from '../../models/total-revenue-model';
import { BarChartComponent } from '../bar-chart/bar-chart.component';
import { PieChartComponent } from '../pie-chart/pie-chart.component';
import { RecentOrdersComponent } from '../recent-orders/recent-orders.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  standalone: true,
  imports: [
    BarChartComponent,
    PieChartComponent,
    RecentOrdersComponent,
    PageHeaderComponent,
    InfoCardComponent
]
})
export class MainComponent implements OnInit, OnDestroy {
  // Backed by a slot map so re-entry (route revisits) replaces each card
  // rather than appending duplicates. `cards` is derived on read.
  private cardSlots: Partial<Record<DashboardCardSlot, InfoCardData>> = {};
  get cards(): InfoCardData[] {
    return (['revenue', 'stock', 'customers'] as DashboardCardSlot[])
      .map(k => this.cardSlots[k])
      .filter((c): c is InfoCardData => c !== undefined);
  }
  recentOrders:RecentOrdersModel[] = []
  topSellingProducts:TopProductCategoriesModel[] = []
  monthlySalesAndLabour:MonthlySalesAndLabourModel[] = []

  constructor(
    private customerService: CustomerDataService,
    private inventoryService: InventoryService,
    private ordersService: OrderService,
    private productCategoryService: ProductCategoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService:LoggerService
  ) {}
  
  ngOnDestroy(): void {
    this.loaderService.stop()
  }

  ngOnInit() {
    this.getTotalRevenueInLast6Months();
    this.getTotalStock();
    this.getTotalCustomers();
    this.getRecentOrders()
    this.getTopProductCategories()
    this.getSalesAndLabour()
  }

  async getSalesAndLabour() {
    try {
      this.loggerService.LogInfo("getSalesAndLabour() Request Started.")
      const response: SalesAndLabourModel[] = await this.ordersService.getSalesAndLabour();
      if (response[0].monthlySalesAndLabour) {
        this.monthlySalesAndLabour = [...response[0].monthlySalesAndLabour]          
      }
      this.loggerService.LogInfo("getSalesAndLabour() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getSalesAndLabour()")
    }
  }

  async getTopProductCategories() {
    try {
      this.loggerService.LogInfo("getTopProductCategories() Request Started.")
      const response: TopProductCategoriesModel[] = await this.productCategoryService.getTopProductCategories();
      this.topSellingProducts = response
      this.loggerService.LogInfo("getTopProductCategories() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getTopProductCategories()")
    }
  }

  async getRecentOrders() {
    try {
      this.loggerService.LogInfo("getRecentOrders() Request Started.")
    
      if(this.loaderService.getLoader()) {
        this.loaderService.start()
      }
      const response:any = await this.ordersService.getRecentOrders();
      this.recentOrders = [...response]
      this.loaderService.stop()
      this.loggerService.LogInfo("getRecentOrders() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getRecentOrders()")
      this.loaderService.stop()
    }
  }

  async getTotalCustomers() {
    try {
      this.loggerService.LogInfo("getTotalCustomers() Request Started.")

      this.loaderService.start();
      const response: TotalCustomersModel[] = await this.customerService.getTotalCustomers();
      this.loaderService.stop();
      this.cardSlots.customers = {
        cardTitle: 'Customers',
        cardIcon: 'fa-solid fa-users',
        cardValue: response[0].total ?? 0,
        percentageIncrease: response[0].percent_increase,
        monthsString: 'last 6 months',
      };
      this.loggerService.LogInfo("getTotalCustomers() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getTotalCustomers()")
    }
  }

  async getTotalStock() {
    try {
      this.loggerService.LogInfo("getTotalStock() Request Started.")

      this.loaderService.start();
      const response: TotalStockModel[] = await this.inventoryService.getTotalStock();
      this.loaderService.stop();
      this.cardSlots.stock = {
        cardTitle: 'Total Stock',
        cardIcon: 'fa-solid fa-warehouse',
        cardValue: `${response[0].total ?? 0} gms`,
        percentageIncrease: response[0].percent_increase,
        monthsString: 'last 6 months',
      };
      this.loggerService.LogInfo("getTotalStock() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getTotalStock()")
    }
  }

  async getTotalRevenueInLast6Months() {
    try {
      this.loggerService.LogInfo("getTotalRevenueInLast6Months() Request Started.")

      this.loaderService.start();
      const response: TotalRevenueModel[] = await this.ordersService.getTotalRevenueInLast6Months();
      this.loaderService.stop();
      this.cardSlots.revenue = {
        cardTitle: 'Revenue In 6 Months',
        cardIcon: 'fa-solid fa-suitcase',
        cardValue: `₹ ${response[0].total ?? 0}`,
        percentageIncrease: response[0].percent_increase,
        monthsString: 'last month',
      };
      this.loggerService.LogInfo("getTotalRevenueInLast6Months() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getTotalRevenueInLast6Months()")
    }
  }
}
