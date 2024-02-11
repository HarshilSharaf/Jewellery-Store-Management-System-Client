import { Component, Input, OnInit } from '@angular/core';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';

@Component({
  selector: 'app-order-products-details',
  templateUrl: './order-products-details.component.html',
  styleUrls: ['./order-products-details.component.scss']
})
export class OrderProductsDetailsComponent implements OnInit {

  _productDetails:InvoiceProductDataModel[] = []
  @Input() set productDetails(data:InvoiceProductDataModel[]) {
    this._productDetails = data
  }

  _isLoading = false;
  @Input() set isLoading(value: boolean){
    this._isLoading = value;
  }

  constructor() { }

  ngOnInit(): void {
  }

}
