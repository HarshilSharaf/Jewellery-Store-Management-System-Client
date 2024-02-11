import { AfterViewInit, ChangeDetectorRef, Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { catchError, debounceTime, distinctUntilChanged } from 'rxjs';
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.component.html',
  styleUrls: ['./customers-page.component.scss']
})
export class CustomersPageComponent implements OnInit, AfterViewInit, OnDestroy {

  customerData: CustomerDetails[] = []
  tableColumns = ["id",
    "customerName",
    "phoneNumber",
    "gender",
    "email",
    "actions"]

  displayNameForColumns: ColumnSchema[] =
    [
      {
        key: "id",
        type: "text",
        label: "Id"
      },
      {
        key: "customerName",
        type: "text",
        label: "Name"
      },
      {
        key: "phoneNumber",
        type: "text",
        label: "Phone No."
      },
      {
        key: "gender",
        type: "text",
        label: "Gender"
      },
      {
        key: "email",
        type: "email",
        label: "Email"
      },
      {
        key: "actions",
        type: "text",
        label: "Actions"
      },
    ]

  private getCustomerDataSubscription: any
  private itemsPerPage = 5
  public totalRecords = 0
  private currentSearchQuery= ''
  protected isLoading = false;

  constructor(
    private customerService: CustomerDataService,
    private modalService: NgbModal,
    private cdref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private loggerService: LoggerService,
    private loaderService: NgxUiLoaderService
  ) {}

  ngAfterViewInit() {
    this.getAllCustomersData();
    this.cdref.detectChanges()
  }
  ngOnInit(): void {
  }

  open(content: any) {
    this.modalService.open(content, { ariaLabelledBy: 'modal-basic-title' }).result.then(
      (result) => {
        console.log(`Closed with: ${result}`);
      }
    );
  }

  getAllCustomersData(itemsPerPage = this.itemsPerPage, pageNumber = 1,  searchQuery:string = '') {
    this.loggerService.LogInfo("getAllCustomersData() Request Started From customers-page component.")
    this.loaderService.start()
    this.isLoading = true;
    this.getCustomerDataSubscription = this.customerService.getAllCustomers(false, itemsPerPage, pageNumber, searchQuery)
    .pipe(
      debounceTime(300), // Delay for 300 milliseconds
      distinctUntilChanged(), 
    )
    .subscribe({
        next: (response:any) => {
          {
            this.totalRecords = response[0].totalRecords
            const responseData:CustomerDetails[] = response.slice(1)
            responseData.forEach((element) => {
              element.customerName = element.firstName + ' ' + element.lastName
            });
            this.customerData = responseData;
            this.isLoading = false;
            this.loaderService.stop()
            this.loggerService.LogInfo("getAllCustomersData() Request Completed From customers-page component.")
          }
        },
        error: (error:any)=>{
          this.isLoading = false;
          this.loaderService.stop()
          this.loggerService.LogError(error, "getAllCustomersData() From customers-page component")
        }

      })
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getAllCustomersData(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    this.getAllCustomersData(this.itemsPerPage, 1, this.currentSearchQuery)
  }

  goToViewDetails(customerData: CustomerDetails) {
    this.router.navigate([`view-customer-details/${customerData.customerGuid}`] ,{relativeTo:this.route}); 
  }

  openDeletePopUpForItem(customerData: CustomerDetails) {
    Swal.fire({
      title: `Are you sure you want to delete ${customerData.customerName}?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo("deleteCustomer() Request Started.")
        this.customerService.deleteCustomer(customerData.customerGuid as string).subscribe({
          next: (data) => {
            this.getAllCustomersData()
            Swal.fire(
              'Deleted!',
              "Customer Deleted SuccessFully.",
              'success'
            )
            this.loggerService.LogInfo("deleteCustomer() Request Completed.")
          },
          error: (error) => {
            this.loggerService.LogError(error, "deleteCustomer()")
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


  ngOnDestroy() {
    this.getCustomerDataSubscription.unsubscribe();
  }

}
