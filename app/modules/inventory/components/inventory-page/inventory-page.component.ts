import { Component, OnInit } from '@angular/core';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { forkJoin, Observable } from 'rxjs';
import { MasterCategoryService } from '../../../categories/components/master-categories/services/master-category.service';
import { InfoCardData } from '../../../../shared/models/infoCardData';
import { InventoryService } from '../../services/inventory.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { MasterCategoriesModel } from '../../../categories/models/categories-model';
import { TotalStockModel } from '../../../dashboard/models/total-stock-model';

@Component({
  selector: 'app-inventory-page',
  templateUrl: './inventory-page.component.html',
  styleUrls: ['./inventory-page.component.scss'],
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
    this.masterCategoryService.getMasterCategories().subscribe({
      next: (response: MasterCategoriesModel[]) => {
        // Filter out only the gold and silver categories.
        const goldAndSilverCategory = response.filter(
          (category: MasterCategoriesModel) =>
            category.masterCategoryName.toLowerCase() === 'gold' ||
            category.masterCategoryName.toLowerCase() === 'silver'
        );

        // If there are gold or silver categories, create an object of observables and use forkJoin to combine them.
        if (goldAndSilverCategory.length > 0) {
          // Create an object to store the observables, using category index as the key.
          const observables: Record<string, Observable<TotalStockModel>> = {};
          goldAndSilverCategory.forEach((category: MasterCategoriesModel, index: number) => {
            // Add the observable to the observables object, with key category_{index}.
            observables[`category_${index}`] =
              this.inventoryService.getTotalStockOfMasterCategory(category.id);
          });          

          // When all observables have completed, handle the responses using Object.keys() to iterate through the keys and responses arrays.
          forkJoin(observables).subscribe({
            next: (responses: any) => {
              // Iterate through the keys and responses arrays using Object.keys().
              Object.keys(observables).forEach((key, index) => {
                // Get the response for the current key.
                const response:TotalStockModel[] = responses[key];
                // Create an infoCardData object for the current response.
                const infoCardData: InfoCardData = {
                  cardTitle: `Total ${goldAndSilverCategory[index].masterCategoryName} Stock`,
                  cardIcon: '',
                  cardValue: `${response[0].total ?? 0} gms`,
                  percentageIncrease: response[0].percent_increase,
                  cardIconImage: `./assets/img/${goldAndSilverCategory[
                    index
                  ].masterCategoryName.toLowerCase()}-bars.png`,
                  monthsString: 'last 6 months',
                };
                // Add each infoCardData object to the infoCardsData array.
                this.infoCardsData.push(infoCardData);
              });
            },
          });
        }
        this.loggerService.LogInfo("getMasterCategories() Request Completed From inventory-page component.")
        this.loaderService.stop()
      },
      error: (error) => {
        this.loggerService.LogError(error, "getMasterCategories() From inventory-page component")
        this.loaderService.stop()
      },
    });

    this.loggerService.LogInfo("getTotalStockForGoldAndSilver() Request Completed.")
  }
}
