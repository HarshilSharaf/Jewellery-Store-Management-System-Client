import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AvailableProductsComponent } from '../available-products/available-products.component';
import { MasterCategoryService } from '../../../categories/components/master-categories/services/master-category.service';
import { InventoryService } from '../../services/inventory.service';
import { MasterCategoriesModel } from '../../../categories/models/categories-model';
import { TotalStockModel } from '../../../dashboard/models/total-stock-model';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';

interface StockTile {
  metalName: string;
  totalGrams: number;
  percentIncrease: number;
  icon: string;
}

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory-page.component.html',
  styleUrls: ['./inventory-page.component.scss'],
  standalone: true,
  imports: [CommonModule, AvailableProductsComponent],
})
export class InventoryPageComponent implements OnInit {
  stockTiles: StockTile[] = [];
  stockLoaded = false;

  private readonly cdRef = inject(ChangeDetectorRef);

  constructor(
    private masterCategoryService: MasterCategoryService,
    private inventoryService: InventoryService,
    private loggerService: LoggerService,
  ) {}

  ngOnInit(): void {
    this.getTotalStockForGoldAndSilver();
  }

  async getTotalStockForGoldAndSilver(): Promise<void> {
    try {
      this.loggerService.LogInfo('getTotalStockForGoldAndSilver() Request Started.');
      const response: MasterCategoriesModel[] = await this.masterCategoryService.getMasterCategories();
      const filtered = response.filter(
        (c) =>
          c.masterCategoryName.toLowerCase() === 'gold' ||
          c.masterCategoryName.toLowerCase() === 'silver',
      );

      const promises: Promise<TotalStockModel[]>[] = filtered.map((c) =>
        this.inventoryService.getTotalStockOfMasterCategory(c.id),
      );
      const results = await Promise.all(promises);
      this.stockTiles = results.map((r, i) => ({
        metalName: filtered[i].masterCategoryName,
        totalGrams: Number(r[0]?.total ?? 0),
        percentIncrease: Number(r[0]?.percent_increase ?? 0),
        icon: filtered[i].masterCategoryName.toLowerCase() === 'gold' ? 'lucideGem' : 'lucideBoxes',
      }));
      this.stockLoaded = true;
      this.loggerService.LogInfo('getTotalStockForGoldAndSilver() Request Completed.');
    } catch (error) {
      this.stockLoaded = true;
      this.loggerService.LogError(error, 'getTotalStockForGoldAndSilver()');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  formatGrams(g: number): string {
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 1 }).format(g);
  }
}
