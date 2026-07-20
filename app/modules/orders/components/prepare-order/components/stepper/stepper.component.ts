import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronRight,
  lucideChevronLeft,
  lucideUser,
  lucideShoppingCart,
  lucideFileCheck,
} from '@ng-icons/lucide';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { InvoiceProductDataModel } from '../../../../models/invoice-product-data-model';
import { CartService } from '../../../../../../shared/services/cart.service';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';
import { SelectCustomerComponent } from '../select-customer/select-customer.component';
import { CartBuilderComponent } from '../cart-builder/cart-builder.component';

interface StepConfig {
  key: 'customer' | 'items' | 'review';
  label: string;
  icon: string;
}

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    SelectCustomerComponent,
    CartBuilderComponent,
    CreateInvoiceComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideCheck,
      lucideChevronLeft,
      lucideChevronRight,
      lucideUser,
      lucideShoppingCart,
      lucideFileCheck,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly steps: StepConfig[] = [
    { key: 'customer', label: 'Select customer', icon: 'lucideUser' },
    { key: 'items', label: 'Add items', icon: 'lucideShoppingCart' },
    { key: 'review', label: 'Review & save', icon: 'lucideFileCheck' },
  ];

  readonly activeStep = signal<number>(0);
  readonly selectedCustomer = signal<CustomerDetails | null>(null);

  readonly cartItems = computed<InvoiceProductDataModel[]>(() => {
    const products = this.cartService.getProducts()();
    return Array.isArray(products) ? [...products] : [];
  });

  readonly canAdvanceFromCustomer = computed(() => !!this.selectedCustomer() && this.selectedCustomer()!.id !== null);
  readonly canAdvanceFromItems = computed(() => this.cartItems().length > 0);

  constructor(private cartService: CartService) {}

  setCustomer(customer: CustomerDetails): void {
    this.selectedCustomer.set(customer);
  }

  next(): void {
    const idx = this.activeStep();
    if (idx === 0 && !this.canAdvanceFromCustomer()) return;
    if (idx === 1 && !this.canAdvanceFromItems()) return;
    if (idx < this.steps.length - 1) {
      this.activeStep.set(idx + 1);
    }
  }

  prev(): void {
    if (this.activeStep() > 0) this.activeStep.set(this.activeStep() - 1);
  }

  goTo(index: number): void {
    if (index <= this.activeStep()) {
      this.activeStep.set(index);
      return;
    }
    for (let i = this.activeStep(); i < index; i += 1) {
      if (i === 0 && !this.canAdvanceFromCustomer()) return;
      if (i === 1 && !this.canAdvanceFromItems()) return;
    }
    this.activeStep.set(index);
  }

  isCompleted(index: number): boolean {
    return this.activeStep() > index;
  }
}
