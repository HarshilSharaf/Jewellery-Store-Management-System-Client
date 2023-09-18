import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { AllCategoriesModel } from 'src/app/modules/categories/models/categories-model';
import { ProductDataModel } from 'src/app/modules/orders/models/product-data-model';

@Component({
  selector: 'app-product-details-form',
  templateUrl: './product-details-form.component.html',
  styleUrls: ['./product-details-form.component.scss']
})
export class ProductDetailsFormComponent implements OnInit,OnChanges {

  productDetailsForm!: FormGroup;
  productDetailsFormInitialValues: any
  @Input() productGuid!: string;
  @Input() allCategoriesData!: AllCategoriesModel;
  @Input() productData!: ProductDataModel
  @Input() set _productData(data: ProductDataModel) {
    this.productData = data
  }
  @Input() isLoading: boolean = false
  @Output() refreshProductDetails = new EventEmitter<boolean>()


  constructor(
    private ProductService: AvailableProductsService,
    private formBuilder: FormBuilder,
    private loggerService: LoggerService
  ) {

  }
  //if input data has been changed then repopulate product details form
  ngOnChanges(changes: SimpleChanges): void {
    if(changes['productData'] && this.productData){
      this.populateproductDetailsForm(this.productData)
    }
  }

  ngOnInit(): void {
    this.populateproductDetailsForm(this.productData)
  }


  populateproductDetailsForm(productDetails: any) {
    this.productDetailsForm = this.formBuilder.group({
      "masterCategoryId": [productDetails.masterCategoryId, Validators.required],
      "subCategoryId": [productDetails.subCategoryId, Validators.required],
      "productCategoryId": [productDetails.productCategoryId, Validators.required],
      "productDescription": [productDetails.productDescription],
      "productWeight": [productDetails.productWeight , Validators.required],
    })
    this.productDetailsFormInitialValues = this.productDetailsForm.value
  }

  resetForm() {
    this.productDetailsForm.reset(this.productDetailsFormInitialValues)
  }

  updateProductDetails() {
    this.loggerService.LogInfo("updateProductDetails() Request Started.")

    const updateProductDetailsFormData = { ...this.productDetailsForm.value };

    updateProductDetailsFormData.productGuid = this.productData.productGuid
    this.isLoading = true;
    this.ProductService.updateProductDetails(updateProductDetailsFormData).subscribe({
      next: (data) => {
        this.isLoading = false
        this.refreshProductDetails.emit(true)
        Swal.fire(
          'Operation Complete',
          "Product Details Updated Successfully!",
          'success'
        )
        this.loggerService.LogInfo("updateProductDetails() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "updateProductDetails()")
        this.isLoading = false
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: "Failed to update product details.Internal server error occured!",
        })
      }
    })


  }
}
