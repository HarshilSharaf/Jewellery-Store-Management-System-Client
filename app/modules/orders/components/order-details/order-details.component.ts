import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
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
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { OrderProductsDetailsComponent } from '../order-products-details/order-products-details.component';
import { OrderPaymentsComponent } from '../order-payments/order-payments.component';
import { PrintInvoiceComponent } from '../print-invoice/print-invoice.component';
import { NgxPrintModule } from 'ngx-print';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePrinter } from '@ng-icons/lucide';


@Component({
  selector: 'app-order-details',
  templateUrl: './order-details.component.html',
  styleUrls: ['./order-details.component.scss'],
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, OrderProductsDetailsComponent, OrderPaymentsComponent, PrintInvoiceComponent, NgxPrintModule, NgIcon],
  viewProviders: [provideIcons({ lucidePrinter })],
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
  isLoading = false;
  grandTotal = 0;
  subTotalTaxable = 0;
  totalGstAmount = 0;
  totalMakingAmount = 0;
  totalWastageAmount = 0;
  totalStoneAmount = 0;
  totalDiscountAmount = 0;
  oldGoldCreditAmount = 0;
  roundOffAmount = 0;
  invoiceNumber = '';
  cancelReason: string | null | undefined = null;
  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private route: ActivatedRoute,
    private orderService: OrderService,
    private router: Router,
    private fsService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.orderGuid = params['orderGuid'];
      this.getOrderDetails();
    });
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
    this.isLoading = true;
    this.loaderService.start()
    this.orderService.getOrderDetails(this.orderGuid)
      .then((response: any) => {

        const row = Array.isArray(response) && Array.isArray(response[0])
          ? response[0][0]
          : response[0];

        this.orderData = row as InvoiceDataModel;
        this.grandTotal = Number(row.grandTotal ?? row.totalAmountWithGst ?? 0);
        this.subTotalTaxable = Number(row.subTotalTaxable ?? 0);
        this.totalGstAmount = Number(row.totalCgst ?? 0) + Number(row.totalSgst ?? 0) + Number(row.totalIgst ?? 0);
        this.totalMakingAmount = Number(row.totalMakingCharge ?? 0);
        this.totalWastageAmount = Number(row.totalWastageCharge ?? 0);
        this.totalStoneAmount = Number(row.totalStoneCharge ?? 0);
        this.totalDiscountAmount = Number(row.totalDiscount ?? 0);
        this.oldGoldCreditAmount = Number(row.oldGoldCreditAmount ?? 0);
        this.roundOffAmount = Number(row.roundOffAmount ?? 0);
        this.invoiceNumber = row.invoiceNumber ?? '';
        this.cancelReason = row.cancelReason;
        this.customerData = row.customerDetails ?? row.customer_details ?? ({} as CustomerDetails);
        this.orderData.customer_details = this.customerData;
        this.orderData.customerDetails = this.customerData;

        if (this.customerData?.imagePath) {
          this.customerData.imagePath = this.utilityService.getFilePath(
            this.fsService.customerImagesDir + '\\' + this.customerData.imagePath
          );
        } else if (this.customerData) {
          this.customerData.imagePath = 'assets/img/No-Image-Icon.png';
        }

        this.imageLoaded = true;
        const rawLines = row.lineItems ?? row.invoice_products ?? [];
        this.productsData = Array.isArray(rawLines) ? rawLines as InvoiceProductDataModel[] : [];
        this.orderData.lineItems = this.productsData;
        this.orderData.invoice_products = this.productsData;
        this.paymentsData = row.payments ?? [];
        this.totalPaymentRecieved = 0;
        this.paymentsData?.forEach((payment) => { this.totalPaymentRecieved += Number(payment.amount); });
        this.invoiceData.next(this.orderData);
        this.isLoading = false;
        this.loaderService.stop();
        this.loggerService.LogInfo("getOrderDetails() Request Completed.");
      })
      .catch((error: any) => {
        this.isLoading = false;
        this.loaderService.stop();
        this.loggerService.LogError(error, "getOrderDetails()");
      });
  }

}
