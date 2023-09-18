import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subject } from 'rxjs';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { InvoiceDataModel } from '../../models/invoice-data-model';
import { PaymentsDataModel } from '../../models/payments-data-model';
import { OrderService } from '../../services/order.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { CustomerDetails } from '../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';


@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss']
})
export class OrderDetailsComponent implements OnInit {

  orderGuid:string = ''
  customerData!:CustomerDetails
  productsData:InvoiceProductDataModel[]= []
  orderData!:InvoiceDataModel
  invoiceData = new Subject<InvoiceDataModel>()
  paymentsData:PaymentsDataModel[] = []
  totalPaymentRecieved = 0
  imageLoaded = false


  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private fsService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    this.route.params.subscribe((params) => {
      this.orderGuid = params['orderGuid'];
    });
  }

  ngOnInit(): void {
    this.getOrderDetails()
  }

  printInvoice() {
    this.router.navigate([`print-invoice/${this.orderGuid}`], {state:{
      orderData: this.orderData,
      customerData: this.customerData,
      productsData: this.productsData,
      paymentsData:this.paymentsData
    }})
  }


  getOrderDetails() {
    this.loggerService.LogInfo("getOrderDetails() Request Started.")

    this.loaderService.start()
    this.orderService.getOrderDetails(this.orderGuid).subscribe({
      next: (response:any) => {

        this.orderData = response[0]
        this.orderData.totalAmountWithGst =  Number(this.orderData?.totalAmountWithGst) ?? 0
        this.customerData = response[0].customer_details

        if(this.customerData.imagePath) {
          this.customerData.imagePath = this.utilityService.getFilePath(
            this.fsService.customerImagesDir +
              '\\' +
              this.customerData.imagePath
          );
        }

        else {
          this.customerData.imagePath = 'assets/img/No-Image-Icon.png'
        }

        this.imageLoaded = true
        this.productsData = response[0].invoice_products
        this.paymentsData = response[0].payments ?? []
        this.totalPaymentRecieved = 0
        this.paymentsData?.forEach((payment)=> {
          this.totalPaymentRecieved += Number(payment.amount)
        })
        this.invoiceData.next(this.orderData)
        this.loaderService.stop()
        this.loggerService.LogInfo("getOrderDetails() Request Completed.")
      },
      error: (error)=> {
        this.loaderService.stop()
        this.loggerService.LogError(error, "getOrderDetails()")
      }
    })
  }

}
