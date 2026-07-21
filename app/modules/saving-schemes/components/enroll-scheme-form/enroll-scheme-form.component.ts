import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideLoader, lucidePiggyBank, lucideSearch } from '@ng-icons/lucide';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { SavingSchemesService } from '../../../../shared/services/SavingSchemes/saving-schemes.service';
import { CustomerDetails } from '../../../customers/models/customerDetails';

@Component({
  selector: 'app-enroll-scheme-form',
  templateUrl: './enroll-scheme-form.component.html',
  styleUrls: ['./enroll-scheme-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideX, lucideLoader, lucidePiggyBank, lucideSearch })],
})
export class EnrollSchemeFormComponent implements OnInit {

  @Input() open = false;
  @Input() presetCustomer: CustomerDetails | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() enrolled = new EventEmitter<string>();

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly customerSearch = signal('');
  readonly customerResults = signal<CustomerDetails[]>([]);
  readonly selectedCustomer = signal<CustomerDetails | null>(null);
  readonly showResults = signal(false);
  private searchDebounce: any = null;

  form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly customerService = inject(CustomerDataService);
  private readonly schemesService = inject(SavingSchemesService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly cdRef = inject(ChangeDetectorRef);

  constructor() {
    this.form = this.fb.group({
      planName: ['Golden Harvest', Validators.required],
      monthlyAmount: [5000, [Validators.required, Validators.min(1)]],
      tenureMonths: [11, [Validators.required, Validators.min(1)]],
      bonusInstallments: [1, [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    if (this.presetCustomer) {
      this.selectedCustomer.set(this.presetCustomer);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.saving()) this.requestClose();
  }

  requestClose(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.classList.contains('modal-overlay')) {
      this.requestClose();
    }
  }

  onCustomerSearch(value: string): void {
    this.customerSearch.set(value);
    if (this.searchDebounce) clearTimeout(this.searchDebounce);
    this.searchDebounce = setTimeout(async () => {
      const term = (value ?? '').trim();
      if (!term) {
        this.customerResults.set([]);
        this.showResults.set(false);
        return;
      }
      try {
        const rows: any = await this.customerService.getAllCustomers(false, 8, 1, term);
        const list: CustomerDetails[] = rows.slice(1).map((c: any) => ({
          ...c,
          customerName: `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim(),
        }));
        this.customerResults.set(list);
        this.showResults.set(list.length > 0);
      } catch (err) {
        this.loggerService.LogError(err, 'EnrollSchemeForm.onCustomerSearch');
      } finally {
        this.cdRef.detectChanges();
      }
    }, 200);
  }

  pickCustomer(customer: CustomerDetails): void {
    this.selectedCustomer.set(customer);
    this.customerSearch.set(customer.customerName ?? '');
    this.customerResults.set([]);
    this.showResults.set(false);
  }

  clearCustomer(): void {
    if (this.presetCustomer) return;
    this.selectedCustomer.set(null);
    this.customerSearch.set('');
  }

  clearForm(): void {
    this.form.reset({
      planName: 'Golden Harvest',
      monthlyAmount: 5000,
      tenureMonths: 11,
      bonusInstallments: 1,
    });
    this.errorMessage.set(null);
  }

  async submitForm(): Promise<void> {
    if (!this.form.valid || this.saving()) return;
    const customer = this.selectedCustomer();
    if (!customer?.customerGuid) {
      this.errorMessage.set('Choose a customer first.');
      return;
    }
    this.errorMessage.set(null);
    this.saving.set(true);
    try {
      const authData: any = await this.storeService.get('authData');
      const actorUserId = authData?.uid ?? null;
      const value = this.form.value;
      const result: any = await this.schemesService.enroll({
        customerGuid: customer.customerGuid,
        planName: value.planName,
        monthlyAmount: Number(value.monthlyAmount),
        tenureMonths: Number(value.tenureMonths),
        bonusInstallments: Number(value.bonusInstallments),
        actorUserId,
      });
      const row = Array.isArray(result) ? result.find((r: any) => r?.schemeGuid) : null;
      const schemeGuid: string | null = row?.schemeGuid ?? null;
      this.saving.set(false);
      this.enrolled.emit(schemeGuid ?? '');
      this.clearForm();
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'EnrollSchemeForm.submitForm');
    } finally {
      this.cdRef.detectChanges();
    }
  }
}
