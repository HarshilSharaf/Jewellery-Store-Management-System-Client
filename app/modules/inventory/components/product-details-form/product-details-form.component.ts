import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../categories/models/categories-model';
import { ProductDataModel } from '../../../orders/models/product-data-model';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { Purity } from '../../../../interfaces/Shared/purity';

@Component({
  selector: 'app-product-details-form',
  templateUrl: './product-details-form.component.html',
  styleUrls: ['./product-details-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule]
})
export class ProductDetailsFormComponent implements OnInit, OnChanges {

  productDetailsForm!: FormGroup;
  productDetailsFormInitialValues: any;
  purities: Purity[] = [];

  @Input() productGuid!: string;
  @Input() allCategoriesData!: AllCategoriesModel;
  @Input() productData!: ProductDataModel;
  @Input() set _productData(data: ProductDataModel) {
    this.productData = data;
  }
  @Input() isLoading: boolean = false;
  @Output() refreshProductDetails = new EventEmitter<boolean>();

  constructor(
    private ProductService: AvailableProductsService,
    private formBuilder: FormBuilder,
    private loggerService: LoggerService,
    private puritiesService: PuritiesService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] && this.productData) {
      this.populateproductDetailsForm(this.productData);
    }
  }

  async ngOnInit(): Promise<void> {
    try { this.purities = await this.puritiesService.getPurities(); }
    catch (error) { this.loggerService.LogError(error, 'getPurities()'); }
    if (this.productData) { this.populateproductDetailsForm(this.productData); }
  }

  populateproductDetailsForm(productDetails: any) {
    this.productDetailsForm = this.formBuilder.group({
      sku: [productDetails.sku ?? '', Validators.required],
      huid: [productDetails.huid ?? ''],
      purityCode: [productDetails.purityCode ?? '', Validators.required],
      hsnCode: [productDetails.hsnCode ?? '7113', Validators.required],
      masterCategoryId: [productDetails.masterCategoryId, Validators.required],
      subCategoryId: [productDetails.subCategoryId, Validators.required],
      productCategoryId: [productDetails.productCategoryId, Validators.required],
      productDescription: [productDetails.productDescription ?? ''],
      grossWeight: [Number(productDetails.grossWeight) || 0, [Validators.required, Validators.min(0)]],
      netWeight: [Number(productDetails.netWeight) || 0, [Validators.required, Validators.min(0)]],
      stoneWeight: [Number(productDetails.stoneWeight) || 0, [Validators.min(0)]],
      stoneCharges: [Number(productDetails.stoneCharges) || 0, [Validators.min(0)]],
      makingMode: [productDetails.makingMode ?? 'perGram', Validators.required],
      makingValue: [Number(productDetails.makingValue) || 0, [Validators.required, Validators.min(0)]],
      wastagePercent: [Number(productDetails.wastagePercent) || 0, [Validators.min(0)]],
      costPrice: [Number(productDetails.costPrice) || 0, [Validators.min(0)]],
      tagPrice: [Number(productDetails.tagPrice) || 0, [Validators.min(0)]],
    });
    this.productDetailsFormInitialValues = this.productDetailsForm.value;
  }

  resetForm() {
    this.productDetailsForm.reset(this.productDetailsFormInitialValues);
  }

  updateProductDetails() {
    this.loggerService.LogInfo("updateProductDetails() Request Started.");
    const updateProductDetailsFormData = { ...this.productDetailsForm.value };
    updateProductDetailsFormData.productGuid = this.productData.productGuid;
    this.isLoading = true;
    this.ProductService.updateProductDetails(updateProductDetailsFormData)
      .then(() => {
        this.isLoading = false;
        this.refreshProductDetails.emit(true);
        Swal.fire('Operation Complete', 'Product Details Updated Successfully!', 'success');
        this.loggerService.LogInfo("updateProductDetails() Request Completed.");
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "updateProductDetails()");
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Oops...', text: 'Failed to update product details.' });
      });
  }
}
