import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';

import { Subscription } from 'rxjs';
import { ColumnSchema } from '../../../../shared/models/columnsSchema';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { AvailableProductsService } from './services/available-products.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AllCategoriesModel } from '../../../../modules/categories/models/categories-model';
import { ProductDataModel } from '../../../../modules//orders/models/product-data-model';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';
import { AddProductFormComponent } from './components/add-product-form/add-product-form.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';

@Component({
  selector: 'app-available-products',
  templateUrl: './available-products.component.html',
  styleUrls: ['./available-products.component.scss'],
  standalone: true,
  imports: [AddProductFormComponent, DataTableComponent]
})
export class AvailableProductsComponent implements OnInit, OnDestroy {

  allCategoriesData!: AllCategoriesModel
  allProductsData: ProductDataModel[] = []
  availableCategoriesSubscription: Subscription = new Subscription
  allProductsDataSubscription: Subscription = new Subscription
  displayNameForColumns: ColumnSchema[] = [
    { key: "id", type: "text", label: "#" },
    { key: "sku", type: "text", label: "SKU" },
    { key: "huid", type: "text", label: "HUID" },
    { key: "purityCode", type: "text", label: "Purity" },
    { key: "productDescription", type: "text", label: "Description" },
    { key: "netWeight", type: "text", label: "Net Wt (g)" },
    { key: "grossWeight", type: "text", label: "Gross Wt (g)" },
    { key: "tagPrice", type: "text", label: "Tag Price" },
    { key: "image", type: "text", label: "Image" },
    { key: "masterCategory", type: "text", label: "Master Category" },
    { key: "subCategory", type: "text", label: "Sub Category" },
    { key: "productCategory", type: "text", label: "Product Category" },
    { key: "actions", type: "text", label: "Actions" },
  ];
  tableColumns: string[] = [
    "id",
    "image",
    "sku",
    "huid",
    "purityCode",
    "netWeight",
    "tagPrice",
    "masterCategory",
    "subCategory",
    "productCategory",
    "actions"
  ];

  deleteProductSubscription:Subscription = new Subscription

  private itemsPerPage = 5
  public totalRecords = 0
  private currentSearchQuery = ''
  protected isLoading = false;

  constructor(
    private availableProductService: AvailableProductsService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private router: Router,
    private route: ActivatedRoute,
    private utilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.getAllCategoriesData()
    this.getAllProductsData()
  }

  getAllCategoriesData() {
    this.loggerService.LogInfo("getAllCategoriesData() Request Started From available-products component.")

    this.availableProductService.getAllCategories()
      .then((response: any) => {

        this.allCategoriesData = {
          masterCategories: response[0].MasterCategoriesData,
          subCategories: response[1].SubCategoriesData,
          productCategories: response[2].ProductCategoriesData
        }
        this.loggerService.LogInfo("getAllCategoriesData() Request Completed From available-products component.")
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getAllCategoriesData() From available-products component")
      })
  }

  handlePageChange(event:any) {
    // set itemsPerPage to current value else it will not be reflected in searchQuery
    this.itemsPerPage = event.pageSize
    this.getAllProductsData(event.pageSize, event.pageIndex + 1, event.searchQuery)
  }

  handleSearchQuery(searchQuery: string) {
    this.currentSearchQuery = searchQuery
    this.getAllProductsData(this.itemsPerPage, 1, this.currentSearchQuery)
  }


  getAllProductsData(itemsPerPage = this.itemsPerPage, pageNumber = 1, searchQuery:string = '') {
    this.loggerService.LogInfo("getAllProductsData() Request Started.")
    this.isLoading = true;
    this.availableProductService.getAllProductsData(itemsPerPage, pageNumber,searchQuery)
      .then(async (response: any) => {
        this.totalRecords = response[0].totalRecords
        const productsData:ProductDataModel[] = response.slice(1)
        for (let product of productsData) {
          if(product.imagePath){
            product.image = this.utilityService.getFilePath( this.fileSystemService.productImagesDir + '\\' + product.imagePath)
          }
          else {
            product.image = 'assets/img/No-Image-Icon.png'
          }
        }
        
        this.allProductsData = [...productsData]
        this.isLoading = false;
        this.loggerService.LogInfo("getAllProductsData() Request Completed.")
      })
      .catch((error: any) => {
        this.isLoading = false;
        this.loggerService.LogError(error, "getAllProductsData()")
      })
  }

  goToViewProductDetails(product: ProductDataModel) {
    this.router.navigate([`view-product-details/${product.productGuid}`] ,{relativeTo:this.route}); 
  }

  openDeletePopUpForItem(product: ProductDataModel) {
    Swal.fire({
      title: `Are you sure you want to delete this product?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo("deleteProduct() Request Started.")
        this.availableProductService.deleteProduct(product.productGuid)
          .then((response: any) => {
            this.getAllProductsData()
            Swal.fire(
              'Deleted!',
              response.message,
              'success'
            )
            this.loggerService.LogInfo("deleteProduct() Request Completed.")
          })
          .catch((error: any) => {
            Swal.fire(
              'Error!',
              error.error.message,
              'error'
            )
            this.loggerService.LogError(error, "deleteProduct()")
          })
      }
    })
  }

  ngOnDestroy(): void {
    // No subscriptions to unsubscribe from
  }

}
