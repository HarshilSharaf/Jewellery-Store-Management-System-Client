import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceProductDataModel } from '../../models/invoice-product-data-model';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';

@Component({
  selector: 'app-order-products-details',
  templateUrl: './order-products-details.component.html',
  styleUrls: ['./order-products-details.component.scss'],
  standalone: true,
  imports: [CommonModule, SkeletonLoaderComponent]
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
