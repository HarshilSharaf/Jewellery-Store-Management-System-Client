import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePlus,
  lucideSearch,
  lucideUsers,
  lucideUserPlus,
  lucidePhone,
  lucideMail,
  lucideMapPin,
  lucidePencil,
  lucideTrash2,
  lucideExternalLink,
  lucideLoader,
} from '@ng-icons/lucide';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { AddCustomerFormComponent } from '../add-customer-form/add-customer-form.component';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import {
  SimplePaginatorComponent,
  SimplePageEvent,
} from '../../../../shared/components/simple-paginator/simple-paginator.component';

@Component({
  selector: 'app-customers-page',
  templateUrl: './customers-page.component.html',
  styleUrls: ['./customers-page.component.scss'],
  standalone: true,
  imports: [CommonModule, AddCustomerFormComponent, SimplePaginatorComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucidePlus,
      lucideSearch,
      lucideUsers,
      lucideUserPlus,
      lucidePhone,
      lucideMail,
      lucideMapPin,
      lucidePencil,
      lucideTrash2,
      lucideExternalLink,
      lucideLoader,
    }),
  ],
})
export class CustomersPageComponent implements OnInit, OnDestroy {
  customerData: CustomerDetails[] = [];

  protected pageSize = 10;
  protected pageIndex = 0;
  protected totalRecords = 0;
  protected searchQuery = '';
  protected isLoading = false;

  protected showAddCustomerForm = false;
  readonly permissions = inject(PermissionsService);

  private debounceTimer: any;

  constructor(
    private customerService: CustomerDataService,
    private cdref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private loggerService: LoggerService,
    private loaderService: NgxUiLoaderService,
  ) {}

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.getAllCustomersData();
  }

  openAddCustomerDialog(): void {
    this.showAddCustomerForm = true;
  }

  onAddCustomerClosed(): void {
    this.showAddCustomerForm = false;
    this.getAllCustomersData();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.pageIndex = 0;
      this.getAllCustomersData();
    }, 250);
  }

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getAllCustomersData();
  }

  async getAllCustomersData(): Promise<void> {
    try {
      this.loggerService.LogInfo('getAllCustomersData() Request Started From customers-page component.');
      this.isLoading = true;
      this.loaderService.start();

      const response: any = await this.customerService.getAllCustomers(
        false,
        this.pageSize,
        this.pageIndex + 1,
        this.searchQuery,
      );
      this.totalRecords = response[0]?.totalRecords ?? 0;
      const rows: CustomerDetails[] = response.slice(1);
      rows.forEach((r) => {
        r.customerName = `${r.firstName ?? ''} ${r.lastName ?? ''}`.trim();
      });
      this.customerData = rows;
    } catch (error) {
      this.loggerService.LogError(error, 'getAllCustomersData() From customers-page component');
    } finally {
      this.isLoading = false;
      this.loaderService.stop();
      this.cdref.detectChanges();
    }
  }

  goToViewDetails(customer: CustomerDetails): void {
    this.router.navigate([`view-customer-details/${customer.customerGuid}`], { relativeTo: this.route });
  }

  onRowClick(event: MouseEvent, customer: CustomerDetails): void {
    const target = event.target as HTMLElement;
    if (target.closest('.data-row-actions')) {
      return;
    }
    this.goToViewDetails(customer);
  }

  async openDeletePopUpForItem(event: MouseEvent, customer: CustomerDetails): Promise<void> {
    event.stopPropagation();
    const result = await Swal.fire({
      title: `Delete ${customer.customerName}?`,
      text: "You won't be able to revert this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
      cancelButtonText: 'Cancel',
    });

    if (!result.isConfirmed) return;

    try {
      this.loggerService.LogInfo('deleteCustomer() Request Started.');
      await this.customerService.deleteCustomer(customer.customerGuid as string);
      this.getAllCustomersData();
      await Swal.fire('Deleted', 'Customer removed.', 'success');
      this.loggerService.LogInfo('deleteCustomer() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'deleteCustomer()');
      await Swal.fire('Error', error as string, 'error');
    }
  }

  initialsFor(customer: CustomerDetails): string {
    const first = (customer.firstName || '').trim();
    const last = (customer.lastName || '').trim();
    return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase() || '?';
  }

  hasCustomers(): boolean {
    return this.customerData.length > 0;
  }

  showEmptyState(): boolean {
    return !this.isLoading && !this.hasCustomers() && !this.searchQuery;
  }

  showNoResults(): boolean {
    return !this.isLoading && !this.hasCustomers() && !!this.searchQuery;
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.pageIndex = 0;
    this.getAllCustomersData();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
