import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../categories/models/categories-model';
import { ProductDataModel } from '../../../orders/models/product-data-model';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { Purity } from '../../../../interfaces/Shared/purity';
import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLoader, lucideSave, lucideRotateCcw, lucideRefreshCw } from '@ng-icons/lucide';

@Component({
  selector: 'app-product-details-form',
  templateUrl: './product-details-form.component.html',
  styleUrls: ['./product-details-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideLoader, lucideSave, lucideRotateCcw, lucideRefreshCw })],
})
export class ProductDetailsFormComponent implements OnInit, OnChanges {
  productDetailsForm!: FormGroup;
  productDetailsFormInitialValues: any;
  purities: Purity[] = [];
  isAdmin = false;
  readonly permissions = inject(PermissionsService);

  computedPreview: {
    metal: number;
    making: number;
    wastage: number;
    stones: number;
    total: number;
  } | null = null;

  @Input() productGuid!: string;
  @Input() allCategoriesData!: AllCategoriesModel;
  @Input() productData!: ProductDataModel;
  @Input() isLoading = false;
  @Output() refreshProductDetails = new EventEmitter<boolean>();

  constructor(
    private ProductService: AvailableProductsService,
    private formBuilder: FormBuilder,
    private loggerService: LoggerService,
    private puritiesService: PuritiesService,
    private metalRatesService: MetalRatesService,
    private storeService: StoreService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productData'] && this.productData) {
      this.populateproductDetailsForm(this.productData);
    }
  }

  async ngOnInit(): Promise<void> {
    try {
      this.purities = await this.puritiesService.getPurities();
      await this.metalRatesService.getCurrent();
    } catch (error) {
      this.loggerService.LogError(error, 'getPurities()');
    }
    try {
      const auth: any = await this.storeService.get('authData');
      this.isAdmin = auth?.type === 'admin';
    } catch {
      this.isAdmin = false;
    }
    this.permissions.getUserPermissions();
    if (this.productData) {
      this.populateproductDetailsForm(this.productData);
    }
  }

  populateproductDetailsForm(productDetails: any): void {
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
    this.productDetailsForm.valueChanges.subscribe(() => this.recomputePreview());
    this.recomputePreview();
  }

  private recomputePreview(): void {
    if (!this.productDetailsForm) return;
    const v = this.productDetailsForm.value;
    const rateMap = this.metalRatesService.buildSnapshot();
    const rate = v.purityCode ? Number(rateMap[v.purityCode] ?? 0) : 0;
    const net = Number(v.netWeight ?? 0);
    const metal = net * rate;
    let making = 0;
    const makingValue = Number(v.makingValue ?? 0);
    if (v.makingMode === 'flat') making = makingValue;
    else if (v.makingMode === 'perGram') making = makingValue * net;
    else if (v.makingMode === 'percent') making = (metal * makingValue) / 100;
    const wastage = (metal * Number(v.wastagePercent ?? 0)) / 100;
    const stones = Number(v.stoneCharges ?? 0);
    const total = metal + making + wastage + stones;
    this.computedPreview = rate > 0 ? { metal, making, wastage, stones, total } : null;
  }

  onGrossOrNetChange(): void {
    const gross = Number(this.productDetailsForm.value.grossWeight ?? 0);
    const net = Number(this.productDetailsForm.value.netWeight ?? 0);
    const currentStone = Number(this.productDetailsForm.value.stoneWeight ?? 0);
    if (currentStone === 0 && gross > net) {
      this.productDetailsForm.patchValue({ stoneWeight: Number((gross - net).toFixed(3)) }, { emitEvent: false });
    }
    this.recomputePreview();
  }

  setMakingMode(mode: 'flat' | 'perGram' | 'percent'): void {
    this.productDetailsForm.patchValue({ makingMode: mode });
  }

  formatINR(value: number | null | undefined): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  resetForm(): void {
    this.productDetailsForm.reset(this.productDetailsFormInitialValues);
  }

  updateProductDetails(): void {
    this.loggerService.LogInfo('updateProductDetails() Request Started.');
    const updateData = { ...this.productDetailsForm.value };
    updateData.productGuid = this.productData.productGuid;
    this.isLoading = true;
    this.ProductService.updateProductDetails(updateData)
      .then(() => {
        this.isLoading = false;
        this.refreshProductDetails.emit(true);
        Swal.fire('Saved', 'Product details updated.', 'success');
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'updateProductDetails()');
        this.isLoading = false;
        Swal.fire({ icon: 'error', title: 'Update failed', text: 'Failed to update product details.' });
      });
  }
}
