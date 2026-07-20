import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronRight,
  lucideChevronLeft,
} from '@ng-icons/lucide';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { ProductDataModel } from '../../../../models/product-data-model';
import { CartService } from '../../../../../../shared/services/cart.service';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';
import { CartItemsComponent } from '../../../../../../shared/components/cart-items/cart-items.component';
import { SelectCustomerComponent } from '../select-customer/select-customer.component';

interface StepConfig {
  key: 'products' | 'customer' | 'invoice' | 'done';
  label: string;
}

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    NgIcon,
    CreateInvoiceComponent,
    CartItemsComponent,
    SelectCustomerComponent,
  ],
  viewProviders: [provideIcons({ lucideCheck, lucideChevronLeft, lucideChevronRight })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  readonly steps: StepConfig[] = [
    { key: 'products', label: 'Review Products' },
    { key: 'customer', label: 'Select Customer' },
    { key: 'invoice', label: 'Prepare Invoice' },
    { key: 'done', label: 'Done' },
  ];

  readonly cartItems = computed<ProductDataModel[]>(() => {
    const products = this.cartService.getProducts()();
    return Array.isArray(products) ? [...products] : [];
  });

  activeStep = 0;
  selectedCustomerData!: CustomerDetails;

  constructor(private cartService: CartService) {}

  setCustomerData(customerData: CustomerDetails) {
    this.selectedCustomerData = customerData;
  }

  canAdvance(fromIndex: number): boolean {
    if (fromIndex === 0) return this.cartItems().length > 0;
    if (fromIndex === 1) return !!this.selectedCustomerData && this.selectedCustomerData.id !== null;
    return true;
  }

  next() {
    if (this.canAdvance(this.activeStep) && this.activeStep < this.steps.length - 1) {
      this.activeStep += 1;
    }
  }

  prev() {
    if (this.activeStep > 0) {
      this.activeStep -= 1;
    }
  }

  goTo(index: number) {
    if (index <= this.activeStep) {
      this.activeStep = index;
      return;
    }
    for (let i = this.activeStep; i < index; i += 1) {
      if (!this.canAdvance(i)) return;
    }
    this.activeStep = index;
  }

  isCompleted(index: number): boolean {
    return this.activeStep > index;
  }
}
