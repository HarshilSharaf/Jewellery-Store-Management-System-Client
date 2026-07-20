import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpResponse } from '../../../../../../models/http-response';
import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { AvailableProductsService } from '../../services/available-products.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../../../categories/models/categories-model';
import { ProductDataModel } from '../../../../../orders/models/product-data-model';
import { PuritiesService } from '../../../../../../shared/services/Purities/purities.service';
import { Purity } from '../../../../../../interfaces/Shared/purity';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';

@Component({
  selector: 'app-add-product-form',
  templateUrl: './add-product-form.component.html',
  styleUrls: ['./add-product-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, NgIcon],
  viewProviders: [provideIcons({ lucidePlus })],
})
export class AddProductFormComponent implements OnInit, OnDestroy {

  addProductForm: FormGroup;
  addProductFormInitialValues: unknown;
  public isLoading: boolean = false;
  public addProductResponse: HttpResponse = { status: 0, message: '' };
  @Input() allCategoriesData!: AllCategoriesModel;
  @Output() refreshDataEvent = new EventEmitter<boolean>();
  @ViewChild(ImageUploadComponent, { static: false }) productPhotoComponent!: ImageUploadComponent;

  purities: Purity[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private availableProductService: AvailableProductsService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private puritiesService: PuritiesService
  ) {
    this.addProductForm = formBuilder.group({
      sku: ['', [Validators.required]],
      huid: [''],
      purityCode: ['', Validators.required],
      hsnCode: ['7113', Validators.required],
      masterCategoryId: ['', [Validators.required, Validators.nullValidator]],
      subCategoryId: ['', [Validators.required, Validators.nullValidator]],
      productCategoryId: ['', [Validators.required, Validators.nullValidator]],
      grossWeight: [0, [Validators.required, Validators.min(0)]],
      netWeight: [0, [Validators.required, Validators.min(0)]],
      stoneWeight: [0, [Validators.min(0)]],
      stoneCharges: [0, [Validators.min(0)]],
      makingMode: ['perGram', Validators.required],
      makingValue: [0, [Validators.required, Validators.min(0)]],
      wastagePercent: [0, [Validators.min(0)]],
      costPrice: [0, [Validators.min(0)]],
      tagPrice: [0, [Validators.min(0)]],
      productDescription: [''],
    });
    this.addProductFormInitialValues = this.addProductForm.value;
  }

  async ngOnInit(): Promise<void> {
    try {
      this.purities = await this.puritiesService.getPurities();
    } catch (error) {
      this.loggerService.LogError(error, 'getPurities()');
    }
  }

  submitForm() {
    const addProductFormData = { ...this.addProductForm.value };

    addProductFormData.imagePath = this.productPhotoComponent.customerPhoto?.name ?? null;

    this.isLoading = true;
    this.loggerService.LogInfo("addProduct() Request Started.");
    this.availableProductService.addProduct(addProductFormData)
      .then(async (data: ProductDataModel[]) => {

        if (data[0].imagePath != null && data[0].imagePath != '') {
          try {
            await this.fileSystemService.saveProductImage(this.productPhotoComponent.customerPhoto, data[0].imagePath);
          } catch (error) {
            this.loggerService.LogError(error as string, "saveProductImage() From add-product component");
          }
        }
        this.refreshDataEvent.emit(true);
        this.addProductResponse.status = 200;
        this.addProductResponse.message = "Product Added Successfully!";
        this.isLoading = false;
        this.loggerService.LogInfo("addProduct() Request Completed.");
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "addProduct()");
        this.addProductResponse.status = 500;
        this.addProductResponse.message = typeof error === 'string' ? error : (error?.message ?? 'Failed to add product');
        this.isLoading = false;
      });
  }

  clearForm() {
    this.addProductForm.reset(this.addProductFormInitialValues);
    this.productPhotoComponent.customerPhoto = null;
    this.productPhotoComponent.imageSrc = '';
    this.productPhotoComponent.imageLoaded = false;
    this.isLoading = false;
    this.addProductResponse = { status: 0, message: '' };
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }

}
