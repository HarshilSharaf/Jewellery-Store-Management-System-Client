import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { Subscription } from 'rxjs';
import { CustomerDataService } from '../../../../../customers/services/customer-data.service';
import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';


@Component({
  selector: 'app-select-customer',
  templateUrl: './select-customer.component.html',
  styleUrls: ['./select-customer.component.scss'],
  providers: [DecimalPipe]
})
export class SelectCustomerComponent implements OnInit {

  getAllCustomersSubscription = new Subscription
  dataToBeShown:CustomerDetails[] = []
  customersData:CustomerDetails[] = []
  page = 1;
  pageSize = 5;
  filter = new FormControl('', { nonNullable: true });
  @Output() emitSelectedCustomerData = new EventEmitter<any>()
  selectCustomer = this._formBuilder.group({
    selectedCustomerId: [0, Validators.required],
  });

  constructor(
    private _formBuilder: FormBuilder,
    private customerService: CustomerDataService,
    private fileSystemService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private sanitizer: DomSanitizer,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    this.filter.valueChanges.subscribe((data) => {
      this.dataToBeShown = this.search(data);
      // this.changeCategoryDataToBeShown()
    });
  }

  ngOnInit(): void {
    this.loggerService.LogInfo("getAllCustomers() Request Started From select-customer component.")
    this.customerService.getAllCustomers(true, 10, 1, '', true).subscribe({
      next: async(response:any) => {

        this.loaderService.start()

        for (let customer of response) {

          /*
               NOTE: The following commented out code was taking so long to load all the images of customer
          */
          // customer.image = await this.fileSystemService.getCustomerImageInBase64(customer.imagePath)


          /*
              To resolve the above mentioned issue i've used the convertFileSrc() method of tauri which initiates protocol config
              FOR MORE INFO REFER THIS LINKS: 1) https://github.com/tauri-apps/tauri/discussions/1438
                                              2) https://github.com/breadthe/sd-buddy/commit/8ded008431f07f6a028ebcac2a73f10c76c193f4
                                              3) https://tauri.app/v1/api/js/tauri/#convertfilesrc
          */

          if(customer.imagePath){
            customer.image = this.utilityService.getFilePath( this.fileSystemService.customerImagesDir + '\\' + customer.imagePath)
          }
          else {
            customer.image = 'assets/img/No-Image-Icon.png'
          }

        }


        this.customersData = [...response]
        this.changeCategoryDataToBeShown()
        this.loaderService.stop()
        this.loggerService.LogInfo("getAllCustomers() Request Completed From select-customer component.")

      },
      error: (error) => {
        this.loggerService.LogError(error, "getAllCustomers() From select-customer component")
        this.loaderService.stop()
      }
    })

    //emit selected customer's data whenever the customer is changed
    this.selectCustomer.valueChanges.subscribe((data)=> {
      const selectedCustomerData = this.customersData.find(customer => customer.id === data.selectedCustomerId)
      //puts selected customer to the front of the list
      /*this.customersData = [selectedCustomerData, ...this.customersData.filter(customer => customer.customerId !== data.selectedCustomerId)]
      this.changeCategoryDataToBeShown()*/

      this.emitSelectedCustomerData.emit(selectedCustomerData)
    })
  }

  search(text: string): any[] {
   
    return this.customersData.filter((customer) => {
      const term = text.toLowerCase();
      return (
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.city.toLowerCase().includes(term) ||
        (customer.phoneNumber).toString().includes(term) ||

        //handling full name search term
        (customer.firstName.toLowerCase() +' ' + customer.lastName.toLowerCase()).includes(term) || 
        (customer.firstName.toLowerCase() + customer.lastName.toLowerCase()).includes(term)  
      );
    });
  }
  changeCategoryDataToBeShown() {
    this.dataToBeShown = this.customersData.map((customer: any, i: number) => ({ id: i + 1, ...customer })).slice(
      (this.page - 1) * this.pageSize,
      (this.page - 1) * this.pageSize + this.pageSize,
    );
  }

}
