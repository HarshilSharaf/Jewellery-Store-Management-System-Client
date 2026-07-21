import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { AvailableProductsService } from './services/available-products.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../../modules/categories/models/categories-model';
import { ProductDataModel } from '../../../../modules/orders/models/product-data-model';
import { ActivatedRoute, Router } from '@angular/router';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { AddProductFormComponent } from './components/add-product-form/add-product-form.component';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { Purity } from '../../../../interfaces/Shared/purity';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import {
  SimplePaginatorComponent,
  SimplePageEvent,
} from '../../../../shared/components/simple-paginator/simple-paginator.component';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePackage,
  lucideBoxes,
  lucideGem,
  lucideLayoutGrid,
  lucideList,
  lucidePlus,
  lucideSearch,
  lucidePencil,
  lucideTrash2,
  lucideExternalLink,
  lucideLoader,
  lucideCircleCheck,
  lucideCircleX,
  lucideDownload,
  lucideUpload,
} from '@ng-icons/lucide';
import { MigrationService } from '../../../../shared/services/Migration/migration.service';

interface StockTile {
  metalName: string;
  totalGrams: number;
  percentIncrease: number;
  icon: string;
}

type ViewMode = 'grid' | 'table';

@Component({
  selector: 'app-available-products',
  templateUrl: './available-products.component.html',
  styleUrls: ['./available-products.component.scss'],
  standalone: true,
  imports: [CommonModule, AddProductFormComponent, SimplePaginatorComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucidePackage,
      lucideBoxes,
      lucideGem,
      lucideLayoutGrid,
      lucideList,
      lucidePlus,
      lucideSearch,
      lucidePencil,
      lucideTrash2,
      lucideExternalLink,
      lucideLoader,
      lucideCircleCheck,
      lucideCircleX,
      lucideDownload,
      lucideUpload,
    }),
  ],
})
export class AvailableProductsComponent implements OnInit, OnDestroy {
  @Input() stockTiles: StockTile[] = [];
  @Input() stockLoaded = false;

  allCategoriesData: AllCategoriesModel = {
    masterCategories: [],
    subCategories: [],
    productCategories: [],
  };
  allProductsData: ProductDataModel[] = [];
  displayNameForColumns: ColumnSchema[] = [];
  tableColumns: string[] = [];

  purities: Purity[] = [];

  protected viewMode: ViewMode = 'grid';
  protected pageSize = 12;
  protected pageIndex = 0;
  protected totalRecords = 0;
  protected searchQuery = '';
  protected isLoading = false;
  protected isAdmin = false;
  protected showAddProductForm = false;
  protected exportingCsv = false;
  readonly permissions = inject(PermissionsService);
  private readonly migrationService = inject(MigrationService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

  protected selectedPurities = new Set<string>();
  protected selectedMasterCategories = new Set<number>();
  protected inStockOnly = false;
  protected huidOnly = false;

  private debounceTimer: any;

  constructor(
    private availableProductService: AvailableProductsService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private router: Router,
    private route: ActivatedRoute,
    private utilityService: UtilityService,
    private puritiesService: PuritiesService,
    private storeService: StoreService,
    private cdref: ChangeDetectorRef,
  ) {}

  async ngOnInit(): Promise<void> {
    const storedMode = (typeof localStorage !== 'undefined' && localStorage.getItem('inventory.viewMode')) as ViewMode | null;
    if (storedMode === 'grid' || storedMode === 'table') {
      this.viewMode = storedMode;
    }
    await this.loadAuthType();
    this.permissions.getUserPermissions();
    await Promise.all([this.getAllCategoriesData(), this.loadPurities()]);
    this.getAllProductsData();
  }

  private async loadAuthType(): Promise<void> {
    try {
      const auth: any = await this.storeService.get('authData');
      this.isAdmin = auth?.type === 'admin';
    } catch {
      this.isAdmin = false;
    } finally {
      this.cdref.detectChanges();
    }
  }

  private async loadPurities(): Promise<void> {
    try {
      this.purities = await this.puritiesService.getPurities();
    } catch (error) {
      this.loggerService.LogError(error, 'loadPurities()');
    } finally {
      this.cdref.detectChanges();
    }
  }

  async getAllCategoriesData(): Promise<void> {
    try {
      const response: any = await this.availableProductService.getAllCategories();
      this.allCategoriesData = {
        masterCategories: response[0].MasterCategoriesData,
        subCategories: response[1].SubCategoriesData,
        productCategories: response[2].ProductCategoriesData,
      };
    } catch (error) {
      this.loggerService.LogError(error, 'getAllCategoriesData() From available-products component');
    } finally {
      this.cdref.detectChanges();
    }
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('inventory.viewMode', mode);
    }
  }

  togglePurity(code: string): void {
    if (this.selectedPurities.has(code)) {
      this.selectedPurities.delete(code);
    } else {
      this.selectedPurities.add(code);
    }
    this.pageIndex = 0;
    this.getAllProductsData();
  }

  toggleMasterCategory(id: number): void {
    if (this.selectedMasterCategories.has(id)) {
      this.selectedMasterCategories.delete(id);
    } else {
      this.selectedMasterCategories.add(id);
    }
    this.pageIndex = 0;
    this.getAllProductsData();
  }

  toggleInStockOnly(): void {
    this.inStockOnly = !this.inStockOnly;
    this.pageIndex = 0;
    this.getAllProductsData();
  }

  toggleHuidOnly(): void {
    this.huidOnly = !this.huidOnly;
    this.pageIndex = 0;
    this.getAllProductsData();
  }

  hasActiveFilters(): boolean {
    return (
      this.selectedPurities.size > 0 ||
      this.selectedMasterCategories.size > 0 ||
      this.inStockOnly ||
      this.huidOnly ||
      !!this.searchQuery
    );
  }

  clearFilters(): void {
    this.selectedPurities.clear();
    this.selectedMasterCategories.clear();
    this.inStockOnly = false;
    this.huidOnly = false;
    this.searchQuery = '';
    this.pageIndex = 0;
    this.getAllProductsData();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.pageIndex = 0;
      this.getAllProductsData();
    }, 250);
  }

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.getAllProductsData();
  }

  openAddProductForm(): void {
    this.showAddProductForm = true;
  }

  onAddProductClosed(): void {
    this.showAddProductForm = false;
    this.getAllProductsData();
  }

  async getAllProductsData(): Promise<void> {
    try {
      this.isLoading = true;
      this.loggerService.LogInfo('getAllProductsData() Request Started.');
      const response: any = await this.availableProductService.getAllProductsData(
        this.pageSize,
        this.pageIndex + 1,
        this.searchQuery,
      );
      this.totalRecords = response[0]?.totalRecords ?? 0;
      const rows: ProductDataModel[] = response.slice(1);
      for (const p of rows) {
        if (p.imagePath) {
          p.image = this.utilityService.getFilePath(this.fileSystemService.productImagesDir + '\\' + p.imagePath);
        } else {
          p.image = '';
        }
      }
      this.allProductsData = this.applyClientFilters(rows);
      this.loggerService.LogInfo('getAllProductsData() Request Completed.');
    } catch (error) {
      this.loggerService.LogError(error, 'getAllProductsData()');
    } finally {
      this.isLoading = false;
      this.cdref.detectChanges();
    }
  }

  private applyClientFilters(rows: ProductDataModel[]): ProductDataModel[] {
    return rows.filter((p) => {
      if (this.selectedPurities.size > 0) {
        const code = (p.purityCode ?? '').toLowerCase();
        const metal = (p.metalType ?? '').toLowerCase();
        const label = (p.purityLabel ?? '').toLowerCase();
        const anyMatch = Array.from(this.selectedPurities).some((sel) => {
          const s = sel.toLowerCase();
          return code === s || label === s || metal === s;
        });
        if (!anyMatch) return false;
      }
      if (this.selectedMasterCategories.size > 0) {
        if (!p.masterCategoryId || !this.selectedMasterCategories.has(p.masterCategoryId)) return false;
      }
      if (this.inStockOnly && (p.isSold === 1 || p.isSold === true)) return false;
      if (this.huidOnly && !p.huid) return false;
      return true;
    });
  }

  goToViewProductDetails(product: ProductDataModel): void {
    this.router.navigate([`view-product-details/${product.productGuid}`], { relativeTo: this.route });
  }

  onRowClick(event: MouseEvent, product: ProductDataModel): void {
    const target = event.target as HTMLElement;
    if (target.closest('.data-row-actions')) return;
    this.goToViewProductDetails(product);
  }

  async openDeletePopUpForItem(event: MouseEvent, product: ProductDataModel): Promise<void> {
    event.stopPropagation();
    const confirmed = await this.dialog.danger('Delete this product?', "You won't be able to revert this.", { confirmButtonText: 'Yes, delete' });
    if (!confirmed) return;
    try {
      this.loggerService.LogInfo('deleteProduct() Request Started.');
      await this.availableProductService.deleteProduct(product.productGuid);
      this.getAllProductsData();
      this.toast.success('Product removed.', 'Deleted');
      this.loggerService.LogInfo('deleteProduct() Request Completed.');
    } catch (error: any) {
      this.loggerService.LogError(error, 'deleteProduct()');
      this.toast.error(error?.error?.message ?? 'Failed to delete product.', 'Error');
    }
  }

  formatINR(value: number | string | null | undefined, digits = 0): string {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: digits,
    }).format(num);
  }

  formatWeight(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 3 }).format(num)}g`;
  }

  purityLabel(p: ProductDataModel): string {
    if (p.purityLabel) return p.purityLabel;
    if (p.purityFineness) return `${p.purityFineness}`;
    return p.purityCode ?? '';
  }

  purityFineness(p: ProductDataModel): string | null {
    if (p.purityFineness) return `${p.purityFineness}`;
    return null;
  }

  productSoldChip(p: ProductDataModel): boolean {
    return p.isSold === 1 || p.isSold === true;
  }

  masterCategoryList(): { id: number; name: string }[] {
    return (this.allCategoriesData?.masterCategories ?? []).map((m) => ({
      id: m.id,
      name: m.masterCategoryName,
    }));
  }

  // Purity chip options come from the loaded purity master list.
  purityChipOptions(): { code: string; label: string; metalType: string }[] {
    return this.purities.map((p) => ({ code: p.code, label: p.label, metalType: p.metalType }));
  }

  formatGrams(g: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(g);
  }

  async exportProductsCsv(): Promise<void> {
    if (this.exportingCsv) { return; }
    this.exportingCsv = true;
    try {
      await this.migrationService.triggerExportProducts(this.permissions.costsVisible());
    } catch (error) {
      this.loggerService.LogError(error, 'exportProductsCsv()');
      this.toast.error('Unable to export products.', 'Export failed');
    } finally {
      this.exportingCsv = false;
      this.cdref.detectChanges();
    }
  }

  openMigrationImport(): void {
    this.router.navigate(['/settings'], { queryParams: { tab: 'migration' } });
  }

  showEmptyState(): boolean {
    return !this.isLoading && this.allProductsData.length === 0 && !this.hasActiveFilters();
  }

  showFilteredEmpty(): boolean {
    return !this.isLoading && this.allProductsData.length === 0 && this.hasActiveFilters();
  }

  ngOnDestroy(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
  }
}
