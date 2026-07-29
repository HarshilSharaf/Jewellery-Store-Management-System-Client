import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
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
import { MetalRatesService } from '../../../../../../shared/services/MetalRates/metal-rates.service';
import { StoreService } from '../../../../../../../../Backend/Shared/store.service';
import { PermissionsService } from '../../../../../../shared/services/Auth/permissions.service';
import { ScaleService } from '../../../../../../shared/services/Hardware/scale.service';
import { AppToastService } from '../../../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideX,
  lucideLoader,
  lucideRefreshCw,
  lucidePlus,
  lucideSave,
  lucideScale,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-add-product-form',
  templateUrl: './add-product-form.component.html',
  styleUrls: ['./add-product-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, NgIcon],
  viewProviders: [provideIcons({ lucideX, lucideLoader, lucideRefreshCw, lucidePlus, lucideSave, lucideScale })],
})
export class AddProductFormComponent implements OnInit, OnDestroy {
  addProductForm: FormGroup;
  addProductFormInitialValues: unknown;
  public isLoading = false;
  public addProductResponse: HttpResponse = { status: 0, message: '' };

  @Input() open = false;
  @Input() allCategoriesData?: AllCategoriesModel;
  @Output() closed = new EventEmitter<void>();
  @Output() refreshDataEvent = new EventEmitter<boolean>();
  @ViewChild(ImageUploadComponent, { static: false }) productPhotoComponent!: ImageUploadComponent;

  purities: Purity[] = [];
  isAdmin = false;
  readonly permissions = inject(PermissionsService);
  readonly scaleService = inject(ScaleService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);

  protected computedPreview: {
    metal: number;
    making: number;
    wastage: number;
    stones: number;
    total: number;
  } | null = null;

  constructor(
    private formBuilder: FormBuilder,
    private availableProductService: AvailableProductsService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private puritiesService: PuritiesService,
    private metalRatesService: MetalRatesService,
    private storeService: StoreService,
  ) {
    this.addProductForm = formBuilder.group({
      sku: ['', [Validators.required]],
      // HUID is optional, but if entered must be the BIS 6-char alphanumeric
      // hallmark id. Validators.pattern treats an empty value as valid.
      huid: ['', [Validators.pattern(/^[A-Za-z0-9]{6}$/)]],
      purityCode: ['', Validators.required],
      hsnCode: ['7113', Validators.required],
      masterCategoryId: ['', [Validators.required]],
      subCategoryId: ['', [Validators.required]],
      productCategoryId: ['', [Validators.required]],
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

    // Auto-compute stoneWeight when gross - net differs, only if user hasn't
    // explicitly overridden it.
    this.addProductForm.valueChanges.subscribe(() => this.recomputePreview());
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
    this.cdRef.detectChanges();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.isLoading) {
      this.requestClose();
    }
  }

  requestClose(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.classList.contains('modal-overlay')) {
      this.requestClose();
    }
  }

  setMakingMode(mode: 'flat' | 'perGram' | 'percent'): void {
    this.addProductForm.patchValue({ makingMode: mode });
  }

  generateSku(): void {
    // Simple SKU based on timestamp + short random suffix.
    const timeMs = Date.now();
    const suffix = Math.floor(Math.random() * 900 + 100);
    const sku = `SKU-${timeMs.toString(36).toUpperCase().slice(-6)}-${suffix}`;
    this.addProductForm.patchValue({ sku });
  }

  /**
   * Captures a stable weighing-scale reading into a weight field (product
   * intake). Mirrors the cart's capture: requires a connected scale and a
   * settled reading. Then re-derives stone weight / pricing preview.
   */
  captureWeight(field: 'grossWeight' | 'netWeight', event?: Event): void {
    event?.preventDefault();
    if (!this.scaleService.isConnected()) {
      this.toast.info('No scale connected — configure in Settings', undefined, { timer: 2400 });
      return;
    }
    const reading = this.scaleService.currentReading();
    if (!reading) {
      this.toast.info('No reading yet — place the item on the scale', undefined, { timer: 2400 });
      return;
    }
    if (!reading.stable) {
      this.toast.warning('Scale not stable — wait for the reading to settle', undefined, { timer: 2200 });
      return;
    }
    this.addProductForm.patchValue({ [field]: reading.grams });
    this.onGrossOrNetChange();
  }

  onGrossOrNetChange(): void {
    const gross = Number(this.addProductForm.value.grossWeight ?? 0);
    const net = Number(this.addProductForm.value.netWeight ?? 0);
    const currentStone = Number(this.addProductForm.value.stoneWeight ?? 0);
    if (currentStone === 0 && gross > 0 && net > 0 && gross > net) {
      this.addProductForm.patchValue({ stoneWeight: Number((gross - net).toFixed(3)) }, { emitEvent: false });
    }
    this.recomputePreview();
  }

  private recomputePreview(): void {
    const v = this.addProductForm.value;
    const purityCode = v.purityCode;
    const rateMap = this.metalRatesService.buildSnapshot();
    const rate = purityCode ? Number(rateMap[purityCode] ?? 0) : 0;
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

  formatINR(value: number | undefined | null): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  async submitForm(): Promise<void> {
    const payload = { ...this.addProductForm.value };
    payload.imagePath = this.productPhotoComponent?.customerPhoto?.name ?? null;

    this.isLoading = true;
    this.loggerService.LogInfo('addProduct() Request Started.');
    try {
      const data: ProductDataModel[] = await this.availableProductService.addProduct(payload);
      if (data[0].imagePath && this.productPhotoComponent?.customerPhoto) {
        try {
          await this.fileSystemService.saveProductImage(this.productPhotoComponent.customerPhoto, data[0].imagePath);
        } catch (error) {
          this.loggerService.LogError(error as string, 'saveProductImage() From add-product component');
        }
      }
      this.refreshDataEvent.emit(true);
      this.addProductResponse.status = 200;
      this.addProductResponse.message = 'Product added successfully.';
      this.isLoading = false;
      setTimeout(() => {
        this.clearForm();
        this.requestClose();
      }, 600);
    } catch (error: any) {
      this.loggerService.LogError(error, 'addProduct()');
      this.addProductResponse.status = 500;
      this.addProductResponse.message = typeof error === 'string' ? error : error?.message ?? 'Failed to add product';
      this.isLoading = false;
    } finally {
      this.cdRef.detectChanges();
    }
  }

  clearForm(): void {
    this.addProductForm.reset(this.addProductFormInitialValues);
    if (this.productPhotoComponent) {
      this.productPhotoComponent.customerPhoto = null;
      this.productPhotoComponent.imageSrc = '';
      this.productPhotoComponent.imageLoaded = false;
    }
    this.isLoading = false;
    this.addProductResponse = { status: 0, message: '' };
  }

  ngOnDestroy(): void {}
}
