import { BreakpointObserver } from '@angular/cdk/layout';
import { StepperOrientation, STEPPER_GLOBAL_OPTIONS } from '@angular/cdk/stepper';
import { Component, OnInit } from '@angular/core';
import { Validators, FormBuilder } from '@angular/forms';
import { Observable, map, Subscription } from 'rxjs';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';
import { ProductDataModel } from '../../../../models/product-data-model';
import { CartService } from '../../../../../../shared/services/cart.service';

@Component({
  selector: 'app-stepper',
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
  providers: [
    {
      provide: STEPPER_GLOBAL_OPTIONS,
      useValue: { showError: true }
    }
  ]

})
export class StepperComponent implements OnInit {

  getProductsSubscription = new Subscription
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
    this.getProductsSubscription = this.cartService.getProducts().subscribe((items) => {
      this.cartItems = [...items]
    })
  }

  setCustomerData(customerData: CustomerDetails) {
    this.selectedCustomerData = customerData
  }

}
