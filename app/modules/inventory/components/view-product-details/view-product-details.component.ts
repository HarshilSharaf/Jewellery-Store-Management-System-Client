import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import Swal from 'sweetalert2';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { ProductImageUploadComponent } from '../product-image-upload/product-image-upload.component';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { AllCategoriesModel } from '../../../categories/models/categories-model';
import { ProductDataModel } from '../../../orders/models/product-data-model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProductDetailsFormComponent } from '../product-details-form/product-details-form.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePencil, lucideTrash, lucideRotateCcw } from '@ng-icons/lucide';

@Component({
  selector: 'app-view-product-details',
  templateUrl: './view-product-details.component.html',
  styleUrls: ['./view-product-details.component.scss'],
  standalone: true,
  imports: [CommonModule, ProductImageUploadComponent, PageHeaderComponent, ProductDetailsFormComponent, NgIcon],
  viewProviders: [provideIcons({ lucidePencil, lucideTrash, lucideRotateCcw })],
})
export class ViewProductDetailsComponent implements OnInit {

  thumbnail: any;
  public isLoading: boolean = false;
  private productGuid: string = ''
  allCategoriesData!:AllCategoriesModel
  productDetails!:ProductDataModel
  @ViewChild(ProductImageUploadComponent) imageUploadComponent!: ProductImageUploadComponent
  protected get productCurrentImage(): any { return this.imageUploadComponent?.productImage; }
  protected initialProductImageSrc: any
  private readonly destroyRef = inject(DestroyRef);

  constructor(private ProductService: AvailableProductsService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private fileSystemService:FileSystemService,
    private loaderService:NgxUiLoaderService,
    private loggerService: LoggerService,
    private utilityService: UtilityService) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      this.productGuid = params['productGuid'];
      this.getAllCategoriesData();
      this.getProductDetails();
      this.getProductImage();
    });
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialProductImageSrc ?? ''
  }

  getProductImage() {
    this.loggerService.LogInfo("getProductImage() Request Started.")

    this.loaderService.start()
    this.ProductService.getProductImage(this.productGuid)
      .then(async (response: any) => {

        if(response.length > 0 && response[0].imagePath) {
          this.thumbnail = this.utilityService.getFilePath(this.fileSystemService.productImagesDir + '\\' +  response[0].imagePath)
        }
        else {
          this.thumbnail = ''
        }
        
        this.initialProductImageSrc = this.thumbnail
        this.imageUploadComponent.imageSrc = this.thumbnail
        this.loaderService.stop()
        this.loggerService.LogInfo("getProductImage() Request Completed.")
      })
      .catch((error: any) => {
        this.loaderService.stop()
        this.imageUploadComponent.imageSrc = ''
        this.imageUploadComponent.productImage = null
        this.loggerService.LogError(error, "getProductImage()")
      })
  }

  deleteProductImage() {
    Swal.fire({
      title: `Are you sure you want to delete this image?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        
        this.loggerService.LogInfo("deleteProductImage() Request Started.")
        this.ProductService.deleteProductImage(this.productGuid)
          .then(async(data: any) => {

            await this.fileSystemService.deleteProductImage(data[0].oldFileName)
            this.loggerService.LogInfo("deleteProductImage() Request Completed.")

            this.getProductImage()
            Swal.fire(
              'Deleted!',
              "Product is successfully Deleted!",
              'success'
            )
          })
          .catch((error: any) => {
            this.loggerService.LogError(error, "deleteProductImage()")
            Swal.fire(
              'Error!',
              "Failed to delete product.Internal Server Error Occured!",
              'error'
            )
          })


      }
    })
  }


  updateProductImage() {
    this.loggerService.LogInfo("updateProductImage() Request Started.")

    this.loaderService.start()
    const formData = {
      productGuid: this.productGuid,
      image: this.imageUploadComponent.productImage?.name ?? null
    }
    this.ProductService.updateProductImage(formData)
      .then(async(data: any) => {

        if (data[0].imagePath) {
          await this.fileSystemService.updateProductImage(
            data[0].oldFileName,
            data[0].imagePath,
            this.imageUploadComponent.productImage)
            .then(() => {
              this.getProductImage()
              this.loaderService.stop()
            })
          }

       else {
        this.loaderService.stop()
       }
      this.loggerService.LogInfo("updateProductImage() Request Completed.")
      })
      .catch((error: any) => {
        this.loaderService.stop()
        this.loggerService.LogError(error, "updateProductImage()")
        Swal.fire({
          icon: 'error',
          title: 'Failed to update Image!!',
          text: error.error.message,
        })
      })
  }

  getAllCategoriesData() {
    this.loggerService.LogInfo("getAllCategoriesData() Request Started From view-product-details component.")
    
    this.ProductService.getAllCategories()
      .then((response: any) => {
        this.allCategoriesData = {
          masterCategories: response[0].MasterCategoriesData,
          subCategories: response[1].SubCategoriesData,
          productCategories: response[2].ProductCategoriesData
        }
        this.loggerService.LogInfo("getAllCategoriesData() Request Completed From view-product-details component.")
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getAllCategoriesData() From view-product-details component")
      })
  }

  getProductDetails(){
    this.loggerService.LogInfo("getProductDetails() Request Started.")

    this.ProductService.getProductDetails(this.productGuid)
      .then((response: any) => {
        this.productDetails = response[0]
        this.loggerService.LogInfo("getProductDetails() Request Completed.")
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getProductDetails()")
      })
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }

}
