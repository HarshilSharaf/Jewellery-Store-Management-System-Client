import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { OrdersDataModel, PaymentStatus } from '../../models/orders-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import Swal from 'sweetalert2';
import { Router, RouterLink} from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideShoppingCart } from '@ng-icons/lucide';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent, RouterLink, NgIcon],
  viewProviders: [provideIcons({ lucideShoppingCart })],
  providers: [DecimalPipe]
})
export class OrdersPageComponent implements OnInit, OnDestroy {


  /*
    Note: Only Add columns in tableColumns if it is also present in displayNameForColumns
    Or else it will throw an error
  */

  tableColumns = ["invoiceNumber",
    "customerFullName",
    "paymentStatus",
    "totalAmountWithGst",
    "orderDate",
    "cancelledAt",
    "actions"]

displayNameForColumns: ColumnSchema[] =
  [
    { key: "invoiceNumber", type: "text", label: "Invoice #" },
    { key: "customerFullName", type: "text", label: "Customer" },
    { key: "totalAmountWithGst", type: "text", label: "Grand Total" },
    { key: "paymentStatus", type: "text", label: "Payment Status" },
    { key: "orderDate", type: "date", label: "Order Date" },
    { key: "cancelledAt", type: "date", label: "Cancelled On" },
    { key: "actions", type: "text", label: "Actions" },
  ]

  itemsPerPage = 5;
  totalRecords = 0
  currentSearchQuery = ''
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  ordersData:OrdersDataModel[] = []
  protected isLoading = false;
  constructor(
    private ordersService: OrderService,
    private decimalPipe: DecimalPipe,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private router: Router
  ) {}
  ngOnInit(): void {
    this.getAllOrders()
  }

  getAllOrders(itemsPerPage = this.itemsPerPage, pageNumber = 1, searchQuery:string = '') {
    this.loggerService.LogInfo("getAllOrders() Request Started.")
    this.isLoading = true

    this.loaderService.start()
    this.ordersService.getAllOrders(itemsPerPage, pageNumber, searchQuery)
      .then((response: any) => {
        this.totalRecords = response[0].totalRecords
        this.ordersData = this.prepareOrdersData(response.slice(1))
        this.isLoading = false
        this.loggerService.LogInfo("getAllOrders() Request Completed.")
        this.loaderService.stop()
      })
      .catch((error: any) => {
        this.isLoading = false
        this.loggerService.LogError(error, "getAllOrders()")
        this.loaderService.stop()
      })
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getAllOrders(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.getAllOrders(this.itemsPerPage, 1, this.currentSearchQuery)
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
      this.searchDebounceTimer = null;
    }
  }

  prepareOrdersData(orders:any):OrdersDataModel[] {
    const ordersData:OrdersDataModel[] = orders.map((order:any) => {
      const cust = order.customerDetails ?? order.customer_details ?? {};
      const grand = Number(order.grandTotal ?? order.totalAmountWithGst ?? 0);
      const isPaid = order.isPaymentDone === true || order.isPaymentDone === 1;
      return {
        orderId: order.id,
        orderGuid: order.invoiceGuid,
        invoiceNumber: order.invoiceNumber,
        placeOfSupply: order.placeOfSupply,
        hsn: order.hsn,
        orderDate: order.createdAt,
        customerFullName: `${cust.firstName ?? ''} ${cust.lastName ?? ''}`.trim(),
        customerId: cust.customerId ?? cust.id ?? 0,
        customerGuid: cust.customerGuid ?? '',
        payments: order.payments ?? [],
        paymentStatus: isPaid ? PaymentStatus.DONE : PaymentStatus.PENDING,
        isPaymentDone: isPaid,
        remarks: order.remarks ?? null,
        totalAmountWithGst: this.decimalPipe.transform(grand),
        subTotalTaxable: order.subTotalTaxable,
        totalCgst: order.totalCgst,
        totalSgst: order.totalSgst,
        totalIgst: order.totalIgst,
        totalMakingCharge: order.totalMakingCharge,
        totalStoneCharge: order.totalStoneCharge,
        totalWastageCharge: order.totalWastageCharge,
        totalDiscount: order.totalDiscount,
        oldGoldCreditAmount: order.oldGoldCreditAmount,
        roundOffAmount: order.roundOffAmount,
        grandTotal: grand,
        cancelledAt: order.cancelledAt,
        cancelReason: order.cancelReason
      } as OrdersDataModel;
    })

    return ordersData
  }

  goToViewDetails(orderData: OrdersDataModel) {
    this.router.navigate([`orders/view-order-details/${orderData.orderGuid}`]); 
  }

  openDeletePopUpForItem(orderData: OrdersDataModel) {
    Swal.fire({
      title: `Are you sure you want to cancel this order?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, cancel it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo("cancelOrder() Request Started.")
        this.ordersService.cancelOrder(orderData.orderGuid)
          .then((data: any) => {
            this.getAllOrders()
            if (data.length == 0 || !data[0]?.message) {
              Swal.fire(
                'Cancelled!',
                "Order Cancelled Successfully.",
                'success'
              )
            this.loggerService.LogInfo("cancelOrder() Request Completed.")
            }
            else {
              this.loggerService.LogError(data[0].message ?? 'Failed to cancel order', "cancelOrder()")
              Swal.fire(
                'Error',
                data[0].message ?? 'Failed to cancel order',
                'error'
              )
            }
          })
          .catch((error: any) => {
            this.loggerService.LogError(error, "cancelOrder()")
            Swal.fire(
              'Error!',
              error,
              'error'
            )
          })


      }
    })
  }

}
