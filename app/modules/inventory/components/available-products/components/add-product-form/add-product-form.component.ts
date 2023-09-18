import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { HttpResponse } from '../../../../../../models/http-response';
import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { AvailableProductsService } from '../../services/available-products.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../../../categories/models/categories-model';
import { ProductDataModel } from '../../../../../orders/models/product-data-model';

@Component({
  selector: 'app-add-product-form',
  templateUrl: './add-product-form.component.html',
  styleUrls: ['./add-product-form.component.scss']
})
export class AddProductFormComponent implements OnInit,OnDestroy {

  addProductForm: FormGroup
  addProductFormInitialValues:unknown
  public isLoading: boolean = false;
  public addProductResponse: HttpResponse = { status: 0, message: '' }
  private addProductSubscription:Subscription = new Subscription;
  @Input() allCategoriesData!:AllCategoriesModel
  @Output() refreshDataEvent = new EventEmitter<boolean>()
  @ViewChild(ImageUploadComponent, { static: false }) productPhotoComponent!: ImageUploadComponent;



  constructor(
    private formBuilder: FormBuilder,
    private availableProductService: AvailableProductsService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService
  ) {
    this.addProductForm = formBuilder.group({
      masterCategoryId: ['', [Validators.required, Validators.nullValidator]],
      subCategoryId: ['', [Validators.required, Validators.nullValidator]],
      productCategoryId: ['', [Validators.required, Validators.nullValidator]],
      productWeight: ['', Validators.required],
      productDescription: [''],
    });
    this.addProductFormInitialValues = this.addProductForm.value;
  }

  ngOnInit(): void {
  }


  submitForm() {
    const addProductFormData = {...this.addProductForm.value}

    addProductFormData.imagePath = this.productPhotoComponent.customerPhoto?.name ?? null

    this.isLoading = true;
    this.loggerService.LogInfo("addProduct() Request Started.")
    this.addProductSubscription = this.availableProductService.addProduct(addProductFormData).subscribe({
      next: async(data:ProductDataModel[]) => {

        if (data[0].imagePath != null && data[0].imagePath != '') {
          try {
            await this.fileSystemService.saveProductImage(this.productPhotoComponent.customerPhoto, data[0].imagePath)
          } catch (error) {
            this.loggerService.LogError(error as string, "saveProductImage() From add-product component")
          }
        }
        this.refreshDataEvent.emit(true);
        this.addProductResponse.status = 200
        this.addProductResponse.message = "Product Added Succesfully!"
        this.isLoading = false
        this.loggerService.LogInfo("addProduct() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error,"addProduct()")
        this.addProductResponse.status = 500
        this.addProductResponse.message = error
        this.isLoading = false
      }
    })
  }

  clearForm() {
    this.addProductForm.reset(this.addProductFormInitialValues)
    this.productPhotoComponent.customerPhoto = null
    this.productPhotoComponent.imageSrc = ''
    this.productPhotoComponent.imageLoaded = false
    this.isLoading = false
    this.addProductResponse = { status: 0, message: '' }
  }

  ngOnDestroy(): void {
    this.addProductSubscription.unsubscribe()
  }

}
