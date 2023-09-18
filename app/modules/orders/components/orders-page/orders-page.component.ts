import { DecimalPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { ColumnSchema } from 'src/app/shared/models/columnsSchema';
import { OrdersDataModel, PaymentStatus } from '../../models/orders-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import Swal from 'sweetalert2';
import { Router} from '@angular/router';

@Component({
  selector: 'app-orders-page',
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.scss'],
  providers: [DecimalPipe]
})
export class OrdersPageComponent implements OnInit {


  /*
    Note: Only Add columns in tableColumns if it is also present in displayNameForColumns
    Or else it will throw an error
  */

  tableColumns = ["orderId",
    "customerFullName",
    // "customerId",
    // "customerGuid",
    // "payments",
    "paymentStatus",
    // "remarks",
    "totalAmountWithGst",
    // "totalAmountWithGstAndDiscount",
    // "totalDiscount",
    // "totalLabour",
    "orderDate",
    "cancelledAt",
    "actions"]

displayNameForColumns: ColumnSchema[] =
  [
    {
      key: "orderId",
      type: "text",
      label: "Id"
    },
    {
      key: "customerFullName",
      type: "text",
      label: "Customer Name"
    },
    {
      key: "totalAmountWithGst",
      type: "text",
      label: "Bill Amount"
    },
    {
      key: "paymentStatus",
      type: "text",
      label: "Payment Status"
    },
    {
      key: "orderDate",
      type: "date",
      label: "Order Date"
    },
    {
      key: "cancelledAt",
      type: "date",
      label: "Cancelled On"
    },
    {
      key: "actions",
      type: "text",
      label: "Actions"
    },
  ]

  itemsPerPage = 5;
  totalRecords = 0
  currentSearchQuery = ''

  getAllOrdersSubscription = new Subscription
  ordersData:OrdersDataModel[] = []
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

    this.loaderService.start()
    this.getAllOrdersSubscription = this.ordersService.getAllOrders(itemsPerPage, pageNumber, searchQuery)
    .pipe(
      debounceTime(300), // Delay for 300 milliseconds
      distinctUntilChanged(), 
    )
    .subscribe({
      next: (response)=> {
        this.totalRecords = response[0].totalRecords
        this.ordersData = this.prepareOrdersData(response.slice(1))
        this.loggerService.LogInfo("getAllOrders() Request Completed.")
        this.loaderService.stop()
      },
      error: (error)=> {
        this.loggerService.LogError(error, "getAllOrders()")
        this.loaderService.stop()
      }
    })
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getAllOrders(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    this.getAllOrders(this.itemsPerPage, 1, this.currentSearchQuery)
  }

  prepareOrdersData(orders:any):OrdersDataModel[] {
    const ordersData:OrdersDataModel[] = orders.map((order:any) => (
      {
        orderId: order.id,
        orderGuid: order.invoiceGuid,
        orderDate: order.createdAt,
        customerFullName: order.customer_details.firstName + ' ' + order.customer_details.lastName,
        customerId: order.customer_details.customerId,
        customerGuid: order.customer_details.customerGuid,
        payments: order.payments,
        paymentStatus: order.isPaymentDone === true? PaymentStatus.DONE : PaymentStatus.PENDING,
        remarks: order.remarks ?? null,
        totalAmountWithGst: this.decimalPipe.transform(order.totalAmountWithGst),
        totalAmountWithGstAndDiscount: order.totalAmountWithoutGstAndDiscount,
        totalDiscount: order.totalDiscount,
        totalGst: order.totalGst,
        totalLabour: order.totalLabour,
        cancelledAt: order.cancelledAt
      }
    ))

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
        this.ordersService.cancelOrder(orderData.orderGuid).subscribe({
          next: (data) => {
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
          },
          error: (error) => {
            this.loggerService.LogError(error, "cancelOrder()")
            Swal.fire(
              'Error!',
              error,
              'error'
            )
          }
        })


      }
    })
  }

}
