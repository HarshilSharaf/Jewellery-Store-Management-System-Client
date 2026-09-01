
import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch, lucideUserPlus, lucideCheck } from '@ng-icons/lucide';
import { Subscription } from 'rxjs';

import {
  SimplePaginatorComponent,
  SimplePageEvent,
} from '../../../../../../shared/components/simple-paginator/simple-paginator.component';
import { CustomerDataService } from '../../../../../customers/services/customer-data.service';
import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';

@Component({
  selector: 'app-select-customer',
  templateUrl: './select-customer.component.html',
  styleUrls: ['./select-customer.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, SimplePaginatorComponent, NgIcon],
  viewProviders: [provideIcons({ lucideSearch, lucideUserPlus, lucideCheck })],
})
export class SelectCustomerComponent implements OnInit, OnDestroy {
  private customerService = inject(CustomerDataService);
  private fileSystemService = inject(FileSystemService);
  private loaderService = inject(NgxUiLoaderService);
  private loggerService = inject(LoggerService);
  private utilityService = inject(UtilityService);


  @Input() set selectedId(value: number | null) {
    this._selectedId.set(value);
  }
  @Output() emitSelectedCustomerData = new EventEmitter<CustomerDetails>();

  readonly _selectedId = signal<number | null>(null);
  readonly filter = new FormControl<string>('', { nonNullable: true });

  private allCustomers: CustomerDetails[] = [];
  readonly visibleCustomers = signal<CustomerDetails[]>([]);
  readonly totalMatches = signal(0);
  readonly loading = signal(false);

  pageIndex = 0;
  pageSize = 6;

  private filterSub?: Subscription;
  private readonly cdRef = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loading.set(true);
    this.loaderService.start();
    this.customerService
      .getAllCustomers(true, 500, 1, '', true)
      .then(async (response: any) => {
        const rows = (response ?? []) as CustomerDetails[];
        for (const customer of rows) {
          if (customer.imagePath) {
            customer.image = await this.fileSystemService.getCustomerImageInBase64(customer.imagePath);
          } else {
            customer.image = 'assets/img/No-Image-Icon.png';
          }
        }
        this.allCustomers = rows;
        this.applyFilter('');
        this.loading.set(false);
        this.loaderService.stop();
        this.cdRef.detectChanges();
      })
      .catch((err) => {
        this.loading.set(false);
        this.loaderService.stop();
        this.loggerService.LogError(err, 'select-customer.getAllCustomers');
        this.cdRef.detectChanges();
      });

    this.filterSub = this.filter.valueChanges.subscribe((value) => {
      this.pageIndex = 0;
      this.applyFilter(value ?? '');
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilter(this.filter.value ?? '');
  }

  private applyFilter(text: string): void {
    const term = text.trim().toLowerCase();
    const filtered = term
      ? this.allCustomers.filter((c) => {
          const first = (c.firstName ?? '').toLowerCase();
          const last = (c.lastName ?? '').toLowerCase();
          const city = (c.city ?? '').toLowerCase();
          const phone = String(c.phoneNumber ?? '');
          return (
            first.includes(term) ||
            last.includes(term) ||
            city.includes(term) ||
            phone.includes(term) ||
            (`${first} ${last}`).includes(term)
          );
        })
      : this.allCustomers;

    this.totalMatches.set(filtered.length);
    const start = this.pageIndex * this.pageSize;
    this.visibleCustomers.set(filtered.slice(start, start + this.pageSize));
  }

  selectCustomer(customer: CustomerDetails): void {
    this._selectedId.set(customer.id);
    this.emitSelectedCustomerData.emit(customer);
  }
}
