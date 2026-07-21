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
  lucideDownload,
  lucideUpload,
} from '@ng-icons/lucide';
import { MigrationService } from '../../../../shared/services/Migration/migration.service';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
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
      lucideDownload,
      lucideUpload,
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
  protected exportingCsv = false;
  readonly permissions = inject(PermissionsService);
  private readonly migrationService = inject(MigrationService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

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
    const guid = customer?.customerGuid;
    if (!guid || typeof guid !== 'string' || guid.trim() === '') {
      this.loggerService.LogError(
        `goToViewDetails: missing customerGuid on customer id=${customer?.id ?? 'unknown'}`,
        'customers-page.goToViewDetails',
      );
      this.toast.warning('Customer link is missing — please refresh the list.');
      return;
    }
    this.router.navigate([`view-customer-details/${guid}`], { relativeTo: this.route });
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
    const confirmed = await this.dialog.danger(`Delete ${customer.customerName}?`, "You won't be able to revert this.", { confirmButtonText: 'Yes, delete' });

    if (!confirmed) return;

    try {
      this.loggerService.LogInfo('deleteCustomer() Request Started.');
      await this.customerService.deleteCustomer(customer.customerGuid as string);
      this.getAllCustomersData();
      this.toast.success('Customer removed.', 'Deleted');
      this.loggerService.LogInfo('deleteCustomer() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'deleteCustomer()');
      this.toast.error(error as string, 'Error');
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

  async exportCustomersCsv(): Promise<void> {
    if (this.exportingCsv) { return; }
    this.exportingCsv = true;
    try {
      await this.migrationService.triggerExportCustomers();
    } catch (error) {
      this.loggerService.LogError(error, 'exportCustomersCsv()');
      this.toast.error('Unable to export customers.', 'Export failed');
    } finally {
      this.exportingCsv = false;
      this.cdref.detectChanges();
    }
  }

  openMigrationImport(): void {
    this.router.navigate(['/settings'], { queryParams: { tab: 'migration' } });
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
