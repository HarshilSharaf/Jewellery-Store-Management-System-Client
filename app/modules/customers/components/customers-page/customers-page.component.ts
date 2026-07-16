import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';

import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { AddCustomerFormComponent } from '../add-customer-form/add-customer-form.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.component.html',
  styleUrls: ['./customers-page.component.scss'],
  standalone: true,
  imports: [MatDialogModule, DataTableComponent, AddCustomerFormComponent, PageHeaderComponent]
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

  private debounceTimer: any;
  private lastRequest: Promise<any> | null = null;
  private itemsPerPage = 5
  public totalRecords = 0
  private currentSearchQuery= ''
  protected isLoading = false;

  showAddCustomerForm = false;

  constructor(
    private customerService: CustomerDataService,
    private dialog: MatDialog,
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

  openAddCustomerDialog(): void {
    const dialogRef = this.dialog.open(AddCustomerFormComponent, {
      width: '600px',
      panelClass: 'add-customer-dialog'
    });

    dialogRef.afterClosed().subscribe(() => {
      this.getAllCustomersData();
    });
  }

  async getAllCustomersData(itemsPerPage = this.itemsPerPage, pageNumber = 1,  searchQuery:string = '') {
    try {
      this.loggerService.LogInfo("getAllCustomersData() Request Started From customers-page component.")
      this.loaderService.start()
      this.isLoading = true;
      
      const response:any = await this.customerService.getAllCustomers(false, itemsPerPage, pageNumber, searchQuery);
      
      this.totalRecords = response[0].totalRecords
      const responseData:CustomerDetails[] = response.slice(1)
      responseData.forEach((element) => {
        element.customerName = element.firstName + ' ' + element.lastName
      });
      this.customerData = responseData;
      this.isLoading = false;
      this.loaderService.stop()
      this.loggerService.LogInfo("getAllCustomersData() Request Completed From customers-page component.")
    } catch (error: any) {
      this.isLoading = false;
      this.loaderService.stop()
      this.loggerService.LogError(error, "getAllCustomersData() From customers-page component")
    }
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getAllCustomersData(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    
    // Debounce search requests
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.getAllCustomersData(this.itemsPerPage, 1, this.currentSearchQuery)
    }, 300);
  }

  goToViewDetails(customerData: CustomerDetails) {
    this.router.navigate([`view-customer-details/${customerData.customerGuid}`] ,{relativeTo:this.route}); 
  }

  async openDeletePopUpForItem(customerData: CustomerDetails) {
    const result = await Swal.fire({
      title: `Are you sure you want to delete ${customerData.customerName}?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        this.loggerService.LogInfo("deleteCustomer() Request Started.")
        await this.customerService.deleteCustomer(customerData.customerGuid as string);
        this.getAllCustomersData()
        await Swal.fire(
          'Deleted!',
          "Customer Deleted SuccessFully.",
          'success'
        )
        this.loggerService.LogInfo("deleteCustomer() Request Completed.")
      } catch (error) {
        this.loggerService.LogError(error, "deleteCustomer()")
        await Swal.fire(
          'Error!',
          error as string,
          'error'
        )
      }
    }
  }

  ngOnDestroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }

}
