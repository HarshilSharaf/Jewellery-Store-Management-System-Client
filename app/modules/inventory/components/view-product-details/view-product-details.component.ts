import { Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import Swal from 'sweetalert2';
import dayjs from 'dayjs';
import { AvailableProductsService } from '../available-products/services/available-products.service';
import { ProductImageUploadComponent } from '../product-image-upload/product-image-upload.component';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { AllCategoriesModel } from '../../../categories/models/categories-model';
import { ProductDataModel } from '../../../orders/models/product-data-model';
import { ProductDetailsFormComponent } from '../product-details-form/product-details-form.component';
import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePencil,
  lucideTrash2,
  lucidePackage,
  lucideRotateCcw,
  lucideCircleCheck,
  lucideCircleX,
  lucideCloudUpload,
  lucideSave,
  lucideX,
  lucideLoader,
  lucidePrinter,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-view-product-details',
  templateUrl: './view-product-details.component.html',
  styleUrls: ['./view-product-details.component.scss'],
  standalone: true,
  imports: [CommonModule, ProductImageUploadComponent, ProductDetailsFormComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePencil,
      lucideTrash2,
      lucidePackage,
      lucideRotateCcw,
      lucideCircleCheck,
      lucideCircleX,
      lucideCloudUpload,
      lucideSave,
      lucideX,
      lucideLoader,
      lucidePrinter,
    }),
  ],
})
export class ViewProductDetailsComponent implements OnInit {
  thumbnail: any;
  public isLoading = false;
  private productGuid = '';
  allCategoriesData!: AllCategoriesModel;
  productDetails!: ProductDataModel;
  isAdmin = false;

  @ViewChild(ProductImageUploadComponent) imageUploadComponent?: ProductImageUploadComponent;
  protected initialProductImageSrc: any;

  editMode = false;
  showImageEditor = false;

  protected computedFloor: number | null = null;

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private ProductService: AvailableProductsService,
    private route: ActivatedRoute,
    private router: Router,
    private fileSystemService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private utilityService: UtilityService,
    private metalRatesService: MetalRatesService,
    private storeService: StoreService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.productGuid = params['productGuid'];
      this.loadAuth();
      this.getAllCategoriesData();
      this.getProductDetails();
      this.getProductImage();
    });
  }

  private async loadAuth(): Promise<void> {
    try {
      const auth: any = await this.storeService.get('authData');
      this.isAdmin = auth?.type === 'admin';
    } catch {
      this.isAdmin = false;
    }
  }

  goBack(): void {
    this.router.navigate(['../../'], { relativeTo: this.route });
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
  }

  toggleImageEditor(): void {
    this.showImageEditor = !this.showImageEditor;
  }

  clearImage(): void {
    if (this.imageUploadComponent) {
      this.imageUploadComponent.imageSrc = this.initialProductImageSrc ?? '';
    }
  }

  async getProductImage(): Promise<void> {
    try {
      this.loaderService.start();
      const response: any = await this.ProductService.getProductImage(this.productGuid);
      if (response.length > 0 && response[0].imagePath) {
        this.thumbnail = this.utilityService.getFilePath(
          this.fileSystemService.productImagesDir + '\\' + response[0].imagePath,
        );
      } else {
        this.thumbnail = '';
      }
      this.initialProductImageSrc = this.thumbnail;
      if (this.imageUploadComponent) {
        this.imageUploadComponent.imageSrc = this.thumbnail;
      }
    } catch (error) {
      if (this.imageUploadComponent) {
        this.imageUploadComponent.imageSrc = '';
        this.imageUploadComponent.productImage = null;
      }
      this.loggerService.LogError(error, 'getProductImage()');
    } finally {
      this.loaderService.stop();
    }
  }

  async deleteProductImage(): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete this image?',
      text: "You won't be able to revert this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      const data: any = await this.ProductService.deleteProductImage(this.productGuid);
      await this.fileSystemService.deleteProductImage(data[0].oldFileName);
      this.getProductImage();
      await Swal.fire('Deleted', 'Product image removed.', 'success');
    } catch (error) {
      this.loggerService.LogError(error, 'deleteProductImage()');
      Swal.fire('Error', 'Failed to delete image.', 'error');
    }
  }

  async updateProductImage(): Promise<void> {
    if (!this.imageUploadComponent) return;
    try {
      this.loaderService.start();
      const formData = {
        productGuid: this.productGuid,
        image: this.imageUploadComponent.productImage?.name ?? null,
      };
      const data: any = await this.ProductService.updateProductImage(formData);
      if (data[0].imagePath) {
        await this.fileSystemService.updateProductImage(
          data[0].oldFileName,
          data[0].imagePath,
          this.imageUploadComponent.productImage,
        );
        this.getProductImage();
      }
    } catch (error: any) {
      this.loggerService.LogError(error, 'updateProductImage()');
      Swal.fire({ icon: 'error', title: 'Failed to update image', text: error?.error?.message ?? 'Please try again.' });
    } finally {
      this.loaderService.stop();
    }
  }

  async getAllCategoriesData(): Promise<void> {
    try {
      const response: any = await this.ProductService.getAllCategories();
      this.allCategoriesData = {
        masterCategories: response[0].MasterCategoriesData,
        subCategories: response[1].SubCategoriesData,
        productCategories: response[2].ProductCategoriesData,
      };
    } catch (error) {
      this.loggerService.LogError(error, 'getAllCategoriesData() From view-product-details component');
    }
  }

  async getProductDetails(): Promise<void> {
    try {
      const response: any = await this.ProductService.getProductDetails(this.productGuid);
      this.productDetails = response[0];
      await this.recomputeFloor();
    } catch (error) {
      this.loggerService.LogError(error, 'getProductDetails()');
    }
  }

  private async recomputeFloor(): Promise<void> {
    if (!this.productDetails) return;
    try {
      await this.metalRatesService.getCurrent();
      const rateMap = this.metalRatesService.buildSnapshot();
      const rate = Number(rateMap[this.productDetails.purityCode] ?? 0);
      if (rate === 0) {
        this.computedFloor = null;
        return;
      }
      const net = Number(this.productDetails.netWeight ?? 0);
      const metal = net * rate;
      let making = 0;
      const makingValue = Number(this.productDetails.makingValue ?? 0);
      if (this.productDetails.makingMode === 'flat') making = makingValue;
      else if (this.productDetails.makingMode === 'perGram') making = makingValue * net;
      else if (this.productDetails.makingMode === 'percent') making = (metal * makingValue) / 100;
      const wastage = (metal * Number(this.productDetails.wastagePercent ?? 0)) / 100;
      const stones = Number(this.productDetails.stoneCharges ?? 0);
      this.computedFloor = metal + making + wastage + stones;
    } catch {
      this.computedFloor = null;
    }
  }

  async markAsSold(): Promise<void> {
    Swal.fire({
      title: 'Mark as sold',
      text: 'To sell a product, add it to an invoice via the Sell workflow. This action will be wired up in Phase 2.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 3200,
      showConfirmButton: false,
    });
  }

  async printTag(): Promise<void> {
    Swal.fire({
      title: 'Barcode tag print',
      text: 'Barcode + HUID label printing is a Phase 2 feature.',
      icon: 'info',
      toast: true,
      position: 'top-end',
      timer: 3200,
      showConfirmButton: false,
    });
  }

  async deleteProduct(): Promise<void> {
    const result = await Swal.fire({
      title: 'Delete this product?',
      text: "You won't be able to revert this.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, delete',
    });
    if (!result.isConfirmed) return;
    try {
      await this.ProductService.deleteProduct(this.productGuid);
      await Swal.fire('Deleted', 'Product removed.', 'success');
      this.router.navigate(['../../'], { relativeTo: this.route });
    } catch (error: any) {
      this.loggerService.LogError(error, 'deleteProduct()');
      Swal.fire('Error', error?.error?.message ?? 'Failed to delete product.', 'error');
    }
  }

  formatINR(value: number | string | null | undefined, digits = 0): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: digits,
    }).format(Number(value ?? 0));
  }

  formatWeight(value: number | string | null | undefined): string {
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(Number(value ?? 0))}g`;
  }

  formatDateShort(date: Date | string | undefined | null): string {
    if (!date) return '-';
    return dayjs(date).format('D MMM YYYY');
  }

  daysInStock(): number | null {
    if (!this.productDetails?.createdAt) return null;
    return dayjs().diff(dayjs(this.productDetails.createdAt), 'day');
  }

  isSold(): boolean {
    return this.productDetails?.isSold === 1 || this.productDetails?.isSold === true;
  }

  makingModeLabel(): string {
    switch (this.productDetails?.makingMode) {
      case 'flat':
        return 'Flat amount';
      case 'perGram':
        return 'Per gram';
      case 'percent':
        return 'Percent of metal';
      default:
        return '-';
    }
  }

  makingValueLabel(): string {
    if (!this.productDetails) return '-';
    const v = this.productDetails.makingValue;
    if (this.productDetails.makingMode === 'percent') return `${v}%`;
    if (this.productDetails.makingMode === 'perGram') return `${this.formatINR(v)}/g`;
    return this.formatINR(v);
  }
}
