import { DecimalPipe } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { CustomerDetails } from 'src/app/modules/customers/models/customerDetails';
import { InvoiceProductDataModel } from 'src/app/modules/orders/models/invoice-product-data-model';
import { ProductDataModel } from 'src/app/modules/orders/models/product-data-model';
import { OrderService } from 'src/app/modules/orders/services/order.service';
import { CartService } from 'src/app/shared/services/cart.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-create-invoice',
  templateUrl: './create-invoice.component.html',
  styleUrls: ['./create-invoice.component.scss'],
  providers: [DecimalPipe]
})
export class CreateInvoiceComponent implements OnInit {

  _selectedCustomersInfo!: CustomerDetails
  _selectedProductsData: InvoiceProductDataModel[] = []
  totalWeight = 0
  totalDiscount = 0
  totalGST = 0
  totalAmountWithGST = 0
  totalAmountWithoutGSTAndDiscount = 0
  totalLabour = 0
  amountPaid = 0
  paymentMethod = 'cash'
  currentDate: Date = new Date()

  @Input() set selectedProductsData(productsData: { lengthOfData: number, selectedProducts: ProductDataModel[] }) {
    this.totalWeight = 0
    this.totalDiscount = 0
    this.totalAmountWithGST = 0
    this.totalGST = 0
    this.totalLabour = 0

    /* creating a clone is necessary otherwise as the data we are getting from the parent is a nested object
     the reference of the array will still be present.
     so any change in the _selectedProductsData will also change cartItems array in the parent component
     Refer this link: https://stackoverflow.com/a/75339720/18480147
    */
    const tempClone = structuredClone(productsData)
    this._selectedProductsData = [...tempClone.selectedProducts]
    this._selectedProductsData.forEach((product) => {
      this.totalWeight += product.productWeight
    })
  }

  @Input() set selectedCustomersInfo(customerInfo: any) {
    this._selectedCustomersInfo = customerInfo
  }

  constructor(
    private orderService: OrderService,
    private cartService: CartService,
    private router: Router,
    private route: ActivatedRoute,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
  }

  getValue(event: Event, productId: number, valueOf: string): number {
    let product = this._selectedProductsData.find(item => item.id === productId)
    if (product) {
      switch (valueOf) {
        case 'labour':
          product.labour = Number((event.target as HTMLInputElement).value)
          this.setFinalAmountOfEachProduct(product)
          this.setTotalAmountWithGST()
          this.setTotalLabour()
          this.setTotalGST()
          this.setTotalAmountWithoutGSTAndDiscount()
          break

        case 'price':
          product.price = Number((event.target as HTMLInputElement).value)
          this.setFinalAmountOfEachProduct(product)
          this.setTotalAmountWithGST()
          this.setTotalAmountWithoutGSTAndDiscount()
          break

        case 'sgst':
          product.SGST = Number((event.target as HTMLInputElement).value)
          this.setFinalAmountOfEachProduct(product)
          this.setTotalAmountWithGST()
          this.setTotalGST()
          this.setTotalAmountWithoutGSTAndDiscount()
          break

        case 'cgst':
          product.CGST = Number((event.target as HTMLInputElement).value)
          this.setFinalAmountOfEachProduct(product)
          this.setTotalAmountWithGST()
          this.setTotalGST()
          this.setTotalAmountWithoutGSTAndDiscount()
          break

        case 'discount':
          product.discount = Number((event.target as HTMLInputElement).value)
          this.setFinalAmountOfEachProduct(product)
          this.setTotalDiscount()
          this.setTotalAmountWithGST()
          this.setTotalAmountWithoutGSTAndDiscount()
          break

      }
    }
    return Number((event.target as HTMLInputElement).value);
  }

  setFinalAmountOfEachProduct(product: InvoiceProductDataModel) {

    product.finalAmount = 0
    let partialSum = (product.labour ?? 0) + (product.price ?? 0) - (product.discount ?? 0)
    let cgst = product.CGST ? partialSum * ((product.CGST ?? 100) / 100) : 0
    let sgst = product.SGST ? partialSum * ((product.SGST ?? 100) / 100) : 0

    product.totalGST = cgst + sgst
    product.finalAmount = Math.round((partialSum + cgst + sgst + Number.EPSILON) * 100) / 100
  }

  setTotalDiscount() {
    this.totalDiscount = 0
    this._selectedProductsData.forEach((item) => {
      this.totalDiscount += item.discount ?? 0
    })
  }

  setTotalAmountWithGST() {
    this.totalAmountWithGST = 0
    this._selectedProductsData.forEach((item) => {
      this.totalAmountWithGST += item.finalAmount ?? 0
    })
  }

  setTotalAmountWithoutGSTAndDiscount() {
    this.totalAmountWithoutGSTAndDiscount = 0
    this._selectedProductsData.forEach((item) => {
      this.totalAmountWithoutGSTAndDiscount += ((item.price ?? 0) + (item.labour ?? 0) )
    })
  }

  setTotalGST() {
    this.totalGST = 0
    this._selectedProductsData.forEach((item) => {
      this.totalGST += item.totalGST ?? 0
    })
    if(this.totalGST)
     this.totalGST = Math.round((this.totalGST + Number.EPSILON) * 100) / 100
  }

  setTotalLabour() {
    this.totalLabour = 0
    this._selectedProductsData.forEach((item) => {
      this.totalLabour += item.labour ?? 0
    })
    if(this.totalLabour)
     this.totalLabour = Math.round((this.totalLabour+ Number.EPSILON) * 100) / 100
  }

  saveOrder() {
    this.loggerService.LogInfo("saveOrder() Request Started.")

    this.loaderService.start()
    const requestData = {
      productsData: this._selectedProductsData,
      customerId: this._selectedCustomersInfo.id,
      totalAmountWithGST: this.totalAmountWithGST,
      totalAmountWithoutGst: this.totalAmountWithoutGSTAndDiscount,
      totalDiscount: this.totalDiscount,
      totalLabour: this.totalLabour,
      totalGST: this.totalGST,
      amountPaid: this.amountPaid,
      paymentMethod: this.paymentMethod
    }

    this.orderService.saveOrder(requestData).subscribe({
      next: (response)=> {
        this.loaderService.stop()
        if (response.length == 0 || !response[0]?.message ) {
          this.cartService.emptyCart()
          let timerInterval: any
          Swal.fire({
            title: 'Order Saved Successfully!',
            html: 'Redirecting to orders page.',
            timer: 3500,
            timerProgressBar: true,
            didOpen: () => {
              Swal.showLoading()
              const b = Swal.getHtmlContainer()?.querySelector('b') as HTMLElement
              timerInterval = setInterval(() => {
                b.textContent = Swal.getTimerLeft()?.toString() ?? '000000'
              }, 100)
            },
            willClose: () => {
              clearInterval(timerInterval)
            }
          }).then((result) => {
            if (result.dismiss === Swal.DismissReason.timer) {
              this.loggerService.LogInfo("saveOrder() Request Completed.")
              this.router.navigate(['../'], { relativeTo: this.route });
            }
          })
        }
        else {
          this.loggerService.LogError(response[0].message ?? 'Failed to save order', "saveOrder()")
          Swal.fire(
            'Error',
            response[0].message ?? 'Failed to save order',
            'error')

        }

      },
      error: (error) => {
        this.loggerService.LogError(error, "saveOrder()")
        this.loaderService.stop()
        Swal.fire(
          'Error',
          error?? 'Failed to save order',
          'error')
      }
    })
  }

}
