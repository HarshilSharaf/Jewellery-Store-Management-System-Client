import { Component, OnInit } from '@angular/core';

import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, Observable } from 'rxjs';
import { MasterCategoryService } from '../../../categories/components/master-categories/services/master-category.service';
import { InfoCardData } from '../../../../shared/models/infoCardData';
import { InventoryService } from '../../services/inventory.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { MasterCategoriesModel } from '../../../categories/models/categories-model';
import { TotalStockModel } from '../../../dashboard/models/total-stock-model';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { InfoCardComponent } from '../../../../shared/components/info-card/info-card.component';
import { AvailableProductsComponent } from '../available-products/available-products.component';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory-page.component.html',
  styleUrls: ['./inventory-page.component.scss'],
  standalone: true,
  imports: [PageHeaderComponent, InfoCardComponent, AvailableProductsComponent]
})
export class InventoryPageComponent implements OnInit {
  infoCardsData: InfoCardData[] = [];

  constructor(
    private masterCategoryService: MasterCategoryService,
    private inventoryService: InventoryService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    this.getTotalStockForGoldAndSilver();
  }

  // This function retrieves all the master categories and filters out only the gold and silver categories.
  getTotalStockForGoldAndSilver() {
    this.loggerService.LogInfo("getTotalStockForGoldAndSilver() Request Started.")

    this.loaderService.start()

    this.loggerService.LogInfo("getMasterCategories() Request Started From inventory-page component.")
    this.masterCategoryService.getMasterCategories()
      .then((response: MasterCategoriesModel[]) => {
        // Filter out only the gold and silver categories.
        const goldAndSilverCategory = response.filter(
          (category: MasterCategoriesModel) =>
            category.masterCategoryName.toLowerCase() === 'gold' ||
            category.masterCategoryName.toLowerCase() === 'silver'
        );

        // If there are gold or silver categories, create promises and use Promise.all to combine them.
        if (goldAndSilverCategory.length > 0) {
          // Create an array of promises for all categories
          const promises: Promise<TotalStockModel[]>[] = [];
          goldAndSilverCategory.forEach((category: MasterCategoriesModel) => {
            promises.push(this.inventoryService.getTotalStockOfMasterCategory(category.id));
          });

          // When all promises have completed, handle the responses
          Promise.all(promises).then((responses: TotalStockModel[][]) => {
            // Rebuild the array from scratch so we never accumulate stale
            // duplicates when the user navigates back to /inventory.
            this.infoCardsData = responses.map((response, index) => ({
              cardTitle: `Total ${goldAndSilverCategory[index].masterCategoryName} Stock`,
              cardIcon: '',
              cardValue: `${response[0].total ?? 0} gms`,
              percentageIncrease: response[0].percent_increase,
              cardIconImage: `./assets/img/${goldAndSilverCategory[index].masterCategoryName.toLowerCase()}-bars.png`,
              monthsString: 'last 6 months',
            }));
          });
        }
        this.loggerService.LogInfo("getMasterCategories() Request Completed From inventory-page component.")
        this.loaderService.stop()
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getMasterCategories() From inventory-page component")
        this.loaderService.stop()
      });

    this.loggerService.LogInfo("getTotalStockForGoldAndSilver() Request Completed.")
  }
}
