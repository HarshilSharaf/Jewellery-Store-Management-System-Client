import { Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import {FileSystemService} from '../../../../../../Backend/Shared/file-system.service'
import { NgxUiLoaderService } from 'ngx-ui-loader'
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from "../../../../../../Backend/Shared/utitlity.service";
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { PaymentStatus } from '../../../orders/models/orders-data-model';
import { CustomerOrders } from '../../models/customer-orders';
import { DeleteCustomerImageModel, UpdateCustomerImageModel } from '../../models/customer-image-model';
import { OrderService } from '../../../orders/services/order.service';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePencil,
  lucideTrash,
  lucideRotateCcw,
  lucideSave,
  lucideLoader,
  lucideUser,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.component.html',
  styleUrls: ['./view-details.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, DataTableComponent, PageHeaderComponent, NgIcon],
  viewProviders: [provideIcons({ lucidePencil, lucideTrash, lucideRotateCcw, lucideSave, lucideLoader, lucideUser })],
  providers: [DecimalPipe]
})
export class ViewDetailsComponent implements OnInit, OnDestroy {

  thumbnail: any;
  public isLoading: boolean = false;
  private customerGuid: string = ''
  @ViewChild(ImageUploadComponent) imageUploadComponent!: ImageUploadComponent
  protected get customerCurrentImage(): any { return this.imageUploadComponent?.customerPhoto; }
  protected initialCustomerImageSrc: any
  private readonly destroyRef = inject(DestroyRef);
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
  private debounceTimer: any;

  constructor(private customerDataService: CustomerDataService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private fileSystemService: FileSystemService,
    private loaderService:NgxUiLoaderService,
    private loggerService: LoggerService,
    private orderService: OrderService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private utilityService: UtilityService
    ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.customerGuid = params['customerGuid'];
      this.getCustomerDetails();
      this.getCustomerOrders();
      this.getCustomerImage();
      this.getTotalAmountOfProductsBoughtForCustomer();
    });
  }

  creditBalance = 0;

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
      "state": [customerDetails.state ?? ''],
      "stateCode": [customerDetails.stateCode ?? ''],
      "gstin": [customerDetails.gstin ?? ''],
      "pan": [customerDetails.pan ?? ''],
      "remarks": [customerDetails.remarks ?? ''],
    });
    this.creditBalance = Number(customerDetails.creditBalance ?? 0);
    this.customerDetailsFormInitialValues = this.customerDetailsForm.value;
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialCustomerImageSrc ?? ''
  }

  async getTotalAmountOfProductsBoughtForCustomer() {
    try {
      this.loggerService.LogInfo("getTotalAmountOfProductsBoughtForCustomer() Request Started.")
      const response:any = await this.customerDataService.getTotalAmountOfProductsBoughtForCustomer(this.customerGuid);
      this.totalAmount = response[0].totalAmount ?? 0
      this.loggerService.LogInfo("getTotalAmountOfProductsBoughtForCustomer() Request Completed.")
    } catch (error) {
      this.loggerService.LogError(error, "getTotalAmountOfProductsBoughtForCustomer()")
    }
  }

  async getCustomerImage() {
    try {
      this.loggerService.LogInfo("getCustomerImage() Request Started From view-customer-details component.")
      this.loaderService.start()
      const response = await this.customerDataService.getCustomerImage(this.customerGuid);
      
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
    } catch (error) {
      this.loaderService.stop()
      this.thumbnail = 'assets/img/No-Image-Icon.png'
      this.initialCustomerImageSrc = this.thumbnail ?? ''
      this.imageUploadComponent.imageSrc = this.thumbnail
      this.loggerService.LogError(error, "getCustomerImage() From view-customer-details component.")
    }
  }

  async getCustomerDetails() {
    try {
      this.loggerService.LogInfo("getCustomerDetails() Request Started From view-customer-details component.")
      this.loaderService.start()
      const response = await this.customerDataService.getCustomerDetails(this.customerGuid);
      this.populateCustomerDetailsForm(response[0])
      this.loaderService.stop()
      this.loggerService.LogInfo("getCustomerDetails() Request Completed From view-customer-details component.")
    } catch (error) {
      this.loggerService.LogError(error, "getCustomerDetails() from view-customer-details component")
      this.loaderService.stop()
    }
  }

  async updateCustomerImage() {
    try {
      this.loggerService.LogInfo("updateCustomerImage() Request Started.")
      this.loaderService.start()
      const formData =  {
        customerGuid: this.customerGuid,
        image: this.imageUploadComponent.customerPhoto?.name ?? null
      }
      const data: UpdateCustomerImageModel[] = await this.customerDataService.updateCustomerImage(formData);
      
      if (data[0].imagePath) {
        await this.fileSystemService.updateCustomerImage(
          data[0].oldFileName,
          data[0].imagePath,
          this.imageUploadComponent.customerPhoto)
        this.getCustomerImage()
        this.loaderService.stop()
        this.loggerService.LogInfo("updateCustomerImage() Request Completed.")
      }
      else {
        this.loaderService.stop()
        this.loggerService.LogInfo("updateCustomerImage() Request Completed.")
      }
    } catch (error) {
      this.loaderService.stop()
      this.loggerService.LogError(error, "updateCustomerImage()")
      Swal.fire({
        icon: 'error',
        title: 'Failed to update Image!!',
        text: (error as any).error?.message,
      })
    }
  }

  async deleteCustomerImage() {
    const result = await Swal.fire({
      title: `Are you sure you want to delete this image?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        this.loggerService.LogInfo("deleteCustomerImage() Request Started.")
        const data: DeleteCustomerImageModel[] = await this.customerDataService.deleteCustomerPhoto(this.customerGuid);
        await this.fileSystemService.deleteCustomerImage(data[0].oldFileName)
        this.loggerService.LogInfo("deleteCustomerImage() Request Completed.")
        this.getCustomerImage()
        await Swal.fire({
          title: 'Deleted!',
          icon: 'success'
        })
      } catch (error) {
        this.loggerService.LogError(error, "deleteCustomerImage()")
        Swal.fire(
          'Error!',
          (error as any).error?.message,
          'error'
        )
      }
    }
  }

  resetForm() {
    this.customerDetailsForm.reset(this.customerDetailsFormInitialValues)
  }

  async updateCustomerDetails() {
    try {
      this.loggerService.LogInfo("updateCustomerDetails() Request Started.")
      const updateCustomerDetailsFormData = {...this.customerDetailsForm.value};
      updateCustomerDetailsFormData.customerGuid= this.customerGuid
      this.isLoading = true;
      await this.customerDataService.updateCustomerDetails(updateCustomerDetailsFormData);
      this.loggerService.LogInfo("updateCustomerDetails() Request Completed.")
      this.isLoading = false
      this.getCustomerDetails()
      await Swal.fire(
        'Operation Complete',
        'Details Updated Successfully!',
        'success'
      )
    } catch (error) {
      this.loggerService.LogError(error, "updateCustomerDetails()")
      this.isLoading = false
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: error as string,
      })
    }
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getCustomerOrders(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    
    // Debounce search requests
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.getCustomerOrders(this.itemsPerPage, 1, this.currentSearchQuery)
    }, 300);
  }

  protected async getCustomerOrders(itemsPerPage = this.itemsPerPage, pageNumber = 1, searchQuery:string = '') {
    try {
      this.loggerService.LogInfo("getCustomerOrders() Request Started.")
      this.isLoadingCustomerOrders = true;
      const res:any = await this.customerDataService.getCustomerOrders(this.customerGuid, itemsPerPage, pageNumber, searchQuery);
      this.totalRecords = res[0].totalRecords
      this.customerOrdersData = this.prepareCustomerOrdersData(res.slice(1))
      this.isLoadingCustomerOrders = false;
      this.loggerService.LogInfo("getCustomerOrders() Request Completed.")
    } catch (error) {
      this.isLoadingCustomerOrders = false;
      this.loggerService.LogError(error, "getCustomerOrders()")
    }
  }

  protected prepareCustomerOrdersData(orders: any) {
    const ordersData:CustomerOrders[] = orders.map((order:any) => (
      {
        orderId: order.orderId ?? order.id,
        orderGuid: order.orderGuid ?? order.invoiceGuid,
        invoiceNumber: order.invoiceNumber,
        numberOfProducts: order.numberOfProducts ?? order.totalLineItems ?? 0,
        orderDate: order.orderDate ?? order.createdAt,
        paymentStatus: (order.paymentStatus === true || order.isPaymentDone === 1 || order.isPaymentDone === true) ? PaymentStatus.DONE : PaymentStatus.PENDING,
        remarks: order.remarks ?? null,
        totalAmountWithGst: this.decimalPipe.transform(order.totalAmountWithGst ?? order.grandTotal),
        grandTotal: order.grandTotal,
        cancelledAt: order.cancelledAt
      }
    ))

    return ordersData
  }

  goToViewDetails(customerOrder: CustomerOrders) {
    this.router.navigate([`orders/view-order-details/${customerOrder.orderGuid}`]);
  }

  async openDeletePopUpForItem(customerOrder: CustomerOrders) {
    const result = await Swal.fire({
      title: `Are you sure you want to delete this order?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!',
    });

    if (result.isConfirmed) {
      try {
        this.loggerService.LogInfo('cancelOrder() Request Started.');
        await this.orderService.cancelOrder(customerOrder.orderGuid);
        this.getCustomerOrders()
        await Swal.fire('Deleted!', 'Order Deleted SuccessFully.', 'success');
        this.loggerService.LogInfo('cancelOrder() Request Completed.');
      } catch (error) {
        this.loggerService.LogError(error, 'cancelOrder()');
        Swal.fire('Error!', error as string, 'error');
      }
    }
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
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
