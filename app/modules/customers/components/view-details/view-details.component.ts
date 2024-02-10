import { AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs/internal/Subscription';
import Swal from 'sweetalert2';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import {FileSystemService} from '../../../../../../Backend/Shared/file-system.service'
import { NgxUiLoaderService } from 'ngx-ui-loader'
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from "../../../../../../Backend/Shared/utitlity.service";
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { DecimalPipe } from '@angular/common';
import { PaymentStatus } from '../../../orders/models/orders-data-model';
import { CustomerOrders } from '../../models/customer-orders';
import { DeleteCustomerImageModel, UpdateCustomerImageModel } from '../../models/customer-image-model';
import { OrderService } from '../../../orders/services/order.service';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.component.html',
  styleUrls: ['./view-details.component.scss'],
  providers: [DecimalPipe]

})
export class ViewDetailsComponent implements OnInit, OnDestroy, AfterViewChecked {

  thumbnail: any;
  public isLoading: boolean = false;
  private customerGuid: string = ''
  @ViewChild(ImageUploadComponent) imageUploadComponent!: ImageUploadComponent
  private getImageSubscription!: Subscription
  private getCustomerOrdersSubscription!: Subscription
  private updateImageSubscription!: Subscription
  private getCustomerDetailsSubscription!: Subscription
  protected customerCurrentImage: any
  protected initialCustomerImageSrc: any
  customerDetailsForm!: FormGroup;
  customerDetailsFormInitialValues: any
  totalAmount = 0
  customerOrdersData:CustomerOrders[] = []
  currentSearchQuery = ''
  tableColumns = ["orderId",
    "numberOfProducts",
    "totalAmountWithGst",
    "orderDate",
    "remarks",
    "cancelledAt",
    "paymentStatus",
    "actions"]

  displayNameForColumns: ColumnSchema[] =
    [
      {
        key: "orderId",
        type: "text",
        label: "Id"
      },
      {
        key: "numberOfProducts",
        type: "text",
        label: "Number Of Products"
      },
      {
        key: "totalAmountWithGst",
        type: "text",
        label: "Total Amount"
      },
      {
        key: "orderDate",
        type: "date",
        label: "Order Date"
      },
      {
        key: "remarks",
        type: "text",
        label: "Remarks"
      },
      {
        key: "cancelledAt",
        type: "date",
        label: "Cancelled On"
      },
      {
        key: "paymentStatus",
        type: "text",
        label: "Payment Status"
      },
      {
        key: "actions",
        type: "text",
        label: "Actions"
      },
    ]
    private itemsPerPage = 5
    public totalRecords = 0
  isLoadingCustomerOrders = false;
  constructor(private customerDataService: CustomerDataService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private changeRef: ChangeDetectorRef,
    private formBuilder: FormBuilder,
    private fileSystemService: FileSystemService,
    private loaderService:NgxUiLoaderService,
    private loggerService: LoggerService,
    private orderService: OrderService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private utilityService: UtilityService
    ) {
    this.route.params.subscribe(params => {
      this.customerGuid = params['customerGuid']
    })
    this.getCustomerDetails()
    this.getCustomerOrders()

  }
  ngAfterViewChecked(): void {
    this.customerCurrentImage = this.imageUploadComponent.customerPhoto
    this.changeRef.detectChanges()
  }

  ngOnInit(): void {
    this.getCustomerImage()
    this.getTotalAmountOfProductsBoughtForCustomer()
  }

  populateCustomerDetailsForm(customerDetails: CustomerDetails) {
    this.customerDetailsForm = this.formBuilder.group({
      "firstName": [customerDetails.firstName, Validators.required],
      "lastName": [customerDetails.lastName, Validators.required],
      "dob": [this.formatDate(new Date(customerDetails.dateOfBirth!))],
      "gender": [customerDetails.gender],
      "address": [customerDetails.address],
      "email": [customerDetails.email],
      "phone": [customerDetails.phoneNumber, Validators.required],
      "city": [customerDetails.city, Validators.required],
    })
    this.customerDetailsFormInitialValues = this.customerDetailsForm.value
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialCustomerImageSrc ?? ''
  }

  getTotalAmountOfProductsBoughtForCustomer() {
    this.loggerService.LogInfo("getTotalAmountOfProductsBoughtForCustomer() Request Started.")
    this.customerDataService.getTotalAmountOfProductsBoughtForCustomer(this.customerGuid).subscribe({
      next: (response:any) => {
        this.totalAmount = response[0].totalAmount ?? 0
        this.loggerService.LogInfo("getTotalAmountOfProductsBoughtForCustomer() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getTotalAmountOfProductsBoughtForCustomer()")
      }
    })
  }

  getCustomerImage() {
    this.loggerService.LogInfo("getCustomerImage() Request Started From view-customer-details component.")

    this.loaderService.start()
    this.getImageSubscription = this.customerDataService.getCustomerImage(this.customerGuid).subscribe({
      next: (response) => {
        
        if(response.length > 0 && response[0].imagePath) {
          this.thumbnail = this.utilityService.getFilePath(this.fileSystemService.customerImagesDir + '\\' +  response[0].imagePath)
        }
        else {
          this.thumbnail = ''
        }
        this.initialCustomerImageSrc = this.thumbnail
        this.imageUploadComponent.imageSrc = this.initialCustomerImageSrc
        this.loaderService.stop()
        this.loggerService.LogInfo("getCustomerImage() Request Completed From view-customer-details component.")
        
      },
      error: (error) => {
        this.loaderService.stop()
        this.thumbnail = 'assets/img/No-Image-Icon.png'
        this.initialCustomerImageSrc = this.thumbnail ?? ''
        this.imageUploadComponent.imageSrc = this.thumbnail
        this.loggerService.LogError(error, "getCustomerImage() From view-customer-details component.")
      }
    })
  }

  getCustomerDetails() {
    this.loggerService.LogInfo("getCustomerDetails() Request Started From view-customer-details component.")
    this.loaderService.start()
    this.getCustomerDetailsSubscription = this.customerDataService.getCustomerDetails(this.customerGuid).subscribe({
      next: (response) => {
        this.populateCustomerDetailsForm(response[0])
        this.loaderService.stop()
        this.loggerService.LogInfo("getCustomerDetails() Request Completed From view-customer-details component.")
      },
      error: (error) => {
        console.log("ERROR TO GET Customer Details:", error)
        this.loggerService.LogError(error, "getCustomerDetails() from view-customer-details component")
        this.loaderService.stop()
      },
    })
  }

  updateCustomerImage() {
    this.loggerService.LogInfo("updateCustomerImage() Request Started.")

    this.loaderService.start()
    const formData =  {
      customerGuid: this.customerGuid,
      image: this.imageUploadComponent.customerPhoto?.name ?? null
    }
    this.updateImageSubscription = this.customerDataService.updateCustomerImage(formData).subscribe({
      next: async(data: UpdateCustomerImageModel[]) => {
        
        if (data[0].imagePath) {
           this.fileSystemService.updateCustomerImage(
            data[0].oldFileName,
            data[0].imagePath,
            this.imageUploadComponent.customerPhoto)
            .then(() => {
              this.getCustomerImage()
              this.loaderService.stop()
            })
          this.loggerService.LogInfo("updateCustomerImage() Request Completed.")
          
        }
        else {
          this.loaderService.stop()
          this.loggerService.LogInfo("updateCustomerImage() Request Completed.")
        }

      },
      error: (error) => {
        this.loaderService.stop()
        this.loggerService.LogError(error, "updateCustomerImage()")
        console.log("Error from updateCustomerImage():", error)
        Swal.fire({
          icon: 'error',
          title: 'Failed to update Image!!',
          text: error.error.message,
        })
      }
    })
  }

  deleteCustomerImage() {
    Swal.fire({
      title: `Are you sure you want to delete this image?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
      this.loggerService.LogInfo("deleteCustomerImage() Request Started.")

        this.customerDataService.deleteCustomerPhoto(this.customerGuid).subscribe({
          next: async(data: DeleteCustomerImageModel[]) => {
            await this.fileSystemService.deleteCustomerImage(data[0].oldFileName)
            this.loggerService.LogInfo("deleteCustomerImage() Request Completed.")
            this.getCustomerImage()
            Swal.fire({
              title: 'Deleted!',
              icon: 'success'
            })
          },
          error: (error) => {
            this.loggerService.LogError(error, "deleteCustomerImage()")
            Swal.fire(
              'Error!',
              error.error.message,
              'error'
            )
          }
        })


      }
    })
  }

  resetForm() {
    this.customerDetailsForm.reset(this.customerDetailsFormInitialValues)
  }

  updateCustomerDetails() {
    this.loggerService.LogInfo("updateCustomerDetails() Request Started.")

    const updateCustomerDetailsFormData = {...this.customerDetailsForm.value};

    updateCustomerDetailsFormData.customerGuid= this.customerGuid
    this.isLoading = true;
    this.customerDataService.updateCustomerDetails(updateCustomerDetailsFormData).subscribe({
      next: (data) => {
        this.loggerService.LogInfo("updateCustomerDetails() Request Completed.")
        this.isLoading = false
        this.getCustomerDetails()
        Swal.fire(
          'Operation Complete',
          'Details Updated Successfully!',
          'success'
        )
      },
      error: (error) => {
        this.loggerService.LogError(error, "updateCustomerDetails()")
        this.isLoading = false
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: error,
        })
      }
    })


  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getCustomerOrders(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    this.getCustomerOrders(this.itemsPerPage, 1, this.currentSearchQuery)
  }

  protected getCustomerOrders(itemsPerPage = this.itemsPerPage, pageNumber = 1, searchQuery:string = '') {
    this.loggerService.LogInfo("getCustomerOrders() Request Started.")
    this.isLoadingCustomerOrders = true;
    this.getCustomerOrdersSubscription = this.customerDataService.getCustomerOrders(this.customerGuid, itemsPerPage, pageNumber, searchQuery)
    .pipe(
      debounceTime(300), // Delay for 300 milliseconds
      distinctUntilChanged(), 
    )
    .subscribe({
      next: (res:any) => {
        this.totalRecords = res[0].totalRecords
        this.customerOrdersData = this.prepareCustomerOrdersData(res.slice(1))
        this.isLoadingCustomerOrders = false;
        this.loggerService.LogInfo("getCustomerOrders() Request Completed.")
      },
      error: (error) => {
        this.isLoadingCustomerOrders = false;
        this.loggerService.LogError(error, "getCustomerOrders()")
      }
    })
  }

  protected prepareCustomerOrdersData(orders: any) {
    const ordersData:CustomerOrders[] = orders.map((order:any) => (
      {
        orderId: order.orderId,
        orderGuid: order.invoiceGuid,
        numberOfProducts: order.numberOfProducts,
        orderDate: order.orderDate,
        paymentStatus: order.paymentStatus === true? PaymentStatus.DONE : PaymentStatus.PENDING,
        remarks: order.remarks ?? null,
        totalAmountWithGst: this.decimalPipe.transform(order.totalAmountWithGst),
        cancelledAt: order.cancelledAt
      }
    ))

    return ordersData
  }

  goToViewDetails(customerOrder: CustomerOrders) {
    this.router.navigate([`orders/view-order-details/${customerOrder.orderGuid}`]);
  }

  openDeletePopUpForItem(customerOrder: CustomerOrders) {
    Swal.fire({
      title: `Are you sure you want to delete this order?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo('cancelOrder() Request Started.');
        this.orderService.cancelOrder(customerOrder.orderGuid).subscribe({
          next: (data) => {
            this.getCustomerOrders()
            Swal.fire('Deleted!', 'Order Deleted SuccessFully.', 'success');
            this.loggerService.LogInfo('cancelOrder() Request Completed.');
          },
          error: (error) => {
            this.loggerService.LogError(error, 'cancelOrder()');
            Swal.fire('Error!', error, 'error');
          },
        });
      }
    });
  }

  private formatDate(date: Date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }

  ngOnDestroy(): void {
    this.getImageSubscription.unsubscribe()
    this.getCustomerDetailsSubscription.unsubscribe()
    this.updateImageSubscription?.unsubscribe()
    this.getCustomerOrdersSubscription?.unsubscribe()
  }
}
