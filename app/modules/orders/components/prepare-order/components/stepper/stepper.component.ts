import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { Observable, map } from 'rxjs';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { ProductDataModel } from '../../../../models/product-data-model';
import { CartService } from '../../../../../../shared/services/cart.service';
import { CreateInvoiceComponent } from '../create-invoice/create-invoice.component';
import { CartItemsComponent } from '../../../../../../shared/components/cart-items/cart-items.component';
import { SelectCustomerComponent } from '../select-customer/select-customer.component';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatStepperModule, MatButtonModule, CreateInvoiceComponent, CartItemsComponent, SelectCustomerComponent],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ]

})
export class StepperComponent implements OnInit {

  cartItems: ProductDataModel[] = []
  selectedCustomerData!: CustomerDetails
  products = this._formBuilder.group({
    firstCtrl: ['', Validators.required],
  });

  thirdFormGroup = this._formBuilder.group({
    thirdCtrl: ['', Validators.required],
  });
  stepperOrientation: Observable<StepperOrientation>;

  constructor(private _formBuilder: FormBuilder, breakpointObserver: BreakpointObserver, private cartService: CartService) {
    this.stepperOrientation = breakpointObserver
      .observe('(min-width: 800px)')
      .pipe(map(({ matches }) => (matches ? 'horizontal' : 'vertical')));
  }

  ngOnInit(): void {
    // Watch the Signal for changes
    effect(() => {
      const products = this.cartService.getProducts();
      this.cartItems = Array.isArray(products) ? [...products] : [];
    });
  }

  setCustomerData(customerData: CustomerDetails) {
    this.selectedCustomerData = customerData
  }

}
