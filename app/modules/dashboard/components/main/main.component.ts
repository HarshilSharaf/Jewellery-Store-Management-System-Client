import { Component, OnDestroy, OnInit } from '@angular/core';
import { Chart } from 'chart.js';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ProductCategoryService } from 'src/app/modules/categories/components/product-categories/services/product-category.service';
import { CustomerDataService } from 'src/app/modules/customers/services/customer-data.service';
import { InventoryService } from 'src/app/modules/inventory/services/inventory.service';
import { OrderService } from 'src/app/modules/orders/services/order.service';
import { InfoCardData } from 'src/app/shared/models/infoCardData';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { RecentOrdersModel } from '../../models/recent-orders-model';
import { MonthlySalesAndLabourModel, SalesAndLabourModel } from '../../models/sales-and-labour-model';
import { TopProductCategoriesModel } from '../../models/top-product-categories-model';
import { TotalCustomersModel } from '../../models/total-customers-model';
import { TotalStockModel } from '../../models/total-stock-model';
import { TotalRevenueModel } from '../../models/total-revenue-model';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, OnDestroy {
  cards: InfoCardData[] = [];
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

  getSalesAndLabour() {
    this.loggerService.LogInfo("getSalesAndLabour() Request Started.")
    this.ordersService.getSalesAndLabour().subscribe({
      next: (response: SalesAndLabourModel[]) => {
        if (response[0].monthlySalesAndLabour) {
          this.monthlySalesAndLabour = [...response[0].monthlySalesAndLabour]          
        }
        this.loggerService.LogInfo("getSalesAndLabour() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getSalesAndLabour()")
      }
    })
  }
  getTopProductCategories() {
    this.loggerService.LogInfo("getTopProductCategories() Request Started.")
    this.productCategoryService.getTopProductCategories().subscribe({
      next: (response: TopProductCategoriesModel[]) => {
        this.topSellingProducts = response
        this.loggerService.LogInfo("getTopProductCategories() Request Completed.")

      },
      error: (error) => {
        this.loggerService.LogError(error, "getTopProductCategories()")
      }
    })
  }

  getRecentOrders() {
    this.loggerService.LogInfo("getRecentOrders() Request Started.")
  
    if(this.loaderService.getLoader()) {
      this.loaderService.start()
    }
    this.ordersService.getRecentOrders().subscribe({
      next: (response:any) => {
        this.recentOrders = [...response]
        this.loaderService.stop()
        this.loggerService.LogInfo("getRecentOrders() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getRecentOrders()")
        this.loaderService.stop()
      }
    })
  }

  getTotalCustomers() {
    this.loggerService.LogInfo("getTotalCustomers() Request Started.")

    this.loaderService.start();
    this.customerService.getTotalCustomers().subscribe({
      next: (response: TotalCustomersModel[]) => {
        this.loaderService.stop();
        const totalCustomers: InfoCardData = {
          cardTitle: 'Customers',
          cardIcon: 'fa-solid fa-users',
          cardValue: response[0].total ?? 0,
          percentageIncrease: response[0].percent_increase,
          monthsString: 'last 6 months',
        };
        this.cards.push(totalCustomers);
        this.loggerService.LogInfo("getTotalCustomers() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getTotalCustomers()")
      },
    });
  }

  getTotalStock() {
    this.loggerService.LogInfo("getTotalStock() Request Started.")

    this.loaderService.start();
    this.inventoryService.getTotalStock().subscribe({
      next: (response: TotalStockModel[]) => {
        this.loaderService.stop();
        const totalStock: InfoCardData = {
          cardTitle: 'Total Stock',
          cardIcon: 'fa-solid fa-warehouse',
          cardValue: `${response[0].total ?? 0} gms`,
          percentageIncrease: response[0].percent_increase,
          monthsString: 'last 6 months',
        };
        this.cards.push(totalStock);
        this.loggerService.LogInfo("getTotalStock() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getTotalStock()")
      },
    });
  }

  getTotalRevenueInLast6Months() {
    this.loggerService.LogInfo("getTotalRevenueInLast6Months() Request Started.")

    this.loaderService.start();
    this.ordersService.getTotalRevenueInLast6Months().subscribe({
      next: (response: TotalRevenueModel[]) => {
        this.loaderService.stop();
        const totalRevenue: InfoCardData = {
          cardTitle: 'Revenue In 6 Months',
          cardIcon: 'fa-solid fa-suitcase',
          cardValue: `₹ ${response[0].total ?? 0}`,
          percentageIncrease: response[0].percent_increase,
          monthsString: 'last month',
        };
        this.cards.push(totalRevenue);
        this.loggerService.LogInfo("getTotalRevenueInLast6Months() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getTotalRevenueInLast6Months()")
      },
    });
  }
}
