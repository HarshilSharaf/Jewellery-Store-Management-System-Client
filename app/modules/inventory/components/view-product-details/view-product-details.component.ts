import { AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription } from 'rxjs';
import { FileSystemService } from 'src/app/shared/services/file-system.service';
import Swal from 'sweetalert2';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { ProductImageUploadComponent } from '../product-image-upload/product-image-upload.component';
import { LoggerService } from 'src/app/shared/services/logger.service';
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { AllCategoriesModel } from 'src/app/modules/categories/models/categories-model';
import { ProductDataModel } from 'src/app/modules/orders/models/product-data-model';

@Component({
  selector: 'app-view-product-details',
  templateUrl: './view-product-details.component.html',
  styleUrls: ['./view-product-details.component.scss']
})
export class ViewProductDetailsComponent implements OnInit,OnDestroy, AfterViewChecked {

  thumbnail: any;
  public isLoading: boolean = false;
  private productGuid: string = ''
  allCategoriesData!:AllCategoriesModel
  productDetails!:ProductDataModel
  @ViewChild(ProductImageUploadComponent) imageUploadComponent!: ProductImageUploadComponent
  private getImageSubscription: Subscription = new Subscription
  private updateImageSubscription: Subscription = new Subscription
  private getAllCategoriesSubscription: Subscription = new Subscription
  private getProductDetailsSubscription: Subscription = new Subscription
  protected productCurrentImage: any
  protected initialProductImageSrc: any



  constructor(private ProductService: AvailableProductsService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private changeRef: ChangeDetectorRef,
    private fileSystemService:FileSystemService,
    private loaderService:NgxUiLoaderService,
    private loggerService: LoggerService) {
      this.route.params.subscribe(params => {
        this.productGuid= params['productGuid']
      })
     }

  ngAfterViewChecked(): void {
  this.productCurrentImage = this.imageUploadComponent.productImage
  this.changeRef.detectChanges()
  }

  ngOnInit(): void {
    this.getAllCategoriesData()
    this.getProductDetails()
    this.getProductImage()
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialProductImageSrc ?? ''
  }

  getProductImage() {
    this.loggerService.LogInfo("getProductImage() Request Started.")

    this.loaderService.start()
    this.getImageSubscription = this.ProductService.getProductImage(this.productGuid).subscribe({
      next: async (response:any) => {

        if(response.length > 0 && response[0].imagePath) {
          this.thumbnail = convertFileSrc(this.fileSystemService.productImagesDir + '\\' +  response[0].imagePath)
        }
        else {
          this.thumbnail = ''
        }
        
        this.initialProductImageSrc = this.thumbnail
        this.imageUploadComponent.imageSrc = this.thumbnail
        this.loaderService.stop()
        this.loggerService.LogInfo("getProductImage() Request Completed.")
      },
      error: (error) => {
        this.loaderService.stop()
        this.imageUploadComponent.imageSrc = ''
        this.imageUploadComponent.productImage = null
        this.productCurrentImage = null
        this.loggerService.LogError(error, "getProductImage()")
      }
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
        this.ProductService.deleteProductImage(this.productGuid).subscribe({
          next: async(data:any) => {

            await this.fileSystemService.deleteProductImage(data[0].oldFileName)
            this.loggerService.LogInfo("deleteProductImage() Request Completed.")

            this.getProductImage()
            Swal.fire(
              'Deleted!',
              "Product is successfully Deleted!",
              'success'
            )
          },
          error: (error) => {
            this.loggerService.LogError(error, "deleteProductImage()")
            Swal.fire(
              'Error!',
              "Failed to delete product.Internal Server Error Occured!",
              'error'
            )
          }
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
    this.updateImageSubscription = this.ProductService.updateProductImage(formData).subscribe({
      next: async(data:any) => {

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
      },
      error: (error) => {
        this.loaderService.stop()
        this.loggerService.LogError(error, "updateProductImage()")
        Swal.fire({
          icon: 'error',
          title: 'Failed to update Image!!',
          text: error.error.message,
        })
      }
    })
  }

  getAllCategoriesData() {
    this.loggerService.LogInfo("getAllCategoriesData() Request Started From view-product-details component.")
    
    this.getAllCategoriesSubscription = this.ProductService.getAllCategories().subscribe({
      next: (response) => {
        this.allCategoriesData = {
          masterCategories: response[0].MasterCategoriesData,
          subCategories: response[1].SubCategoriesData,
          productCategories: response[2].ProductCategoriesData
        }
        this.loggerService.LogInfo("getAllCategoriesData() Request Completed From view-product-details component.")
      },
      error: (error)=>{
        this.loggerService.LogError(error, "getAllCategoriesData() From view-product-details component")
        console.log("Error from getAllCategoriesData():",error)
      }
    })
  }

  getProductDetails(){
    this.loggerService.LogInfo("getProductDetails() Request Started.")

    this.getProductDetailsSubscription = this.ProductService.getProductDetails(this.productGuid).subscribe({
      next:(response:any)=> {
        this.productDetails = response[0]
        this.loggerService.LogInfo("getProductDetails() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "getProductDetails()")
      }
    })
  }

  ngOnDestroy(): void {
    this.getProductDetailsSubscription.unsubscribe()
    this.getImageSubscription.unsubscribe()
    this.getAllCategoriesSubscription.unsubscribe()
    this.updateImageSubscription.unsubscribe()
  }

}
