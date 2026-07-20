import { DecimalPipe } from '@angular/common';
import { Component, EventEmitter, OnInit, OnDestroy, Output } from '@angular/core';
import { FormBuilder, FormControl, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { SimplePaginatorComponent, SimplePageEvent } from '../../../../../../shared/components/simple-paginator/simple-paginator.component';
import { CustomerDataService } from '../../../../../customers/services/customer-data.service';
import { FileSystemService } from '../../../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../../../Backend/Shared/logger.service';
import { CustomerDetails } from '../../../../../customers/models/customerDetails';

@Component({
  selector: 'app-select-customer',
  templateUrl: './select-customer.component.html',
  styleUrls: ['./select-customer.component.scss'],
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, SimplePaginatorComponent],
  providers: [DecimalPipe]
})
export class SelectCustomerComponent implements OnInit, OnDestroy {

  dataToBeShown: CustomerDetails[] = [];
  customersData: CustomerDetails[] = [];
  pageIndex = 0;
  pageSize = 5;
  filter = new FormControl('', { nonNullable: true });
  @Output() emitSelectedCustomerData = new EventEmitter<CustomerDetails>();
  selectCustomer = this._formBuilder.group({
    selectedCustomerId: [0, Validators.required],
  });
  private filterSubscription: any;
  private selectCustomerSubscription: any;

  constructor(
    private _formBuilder: FormBuilder,
    private customerService: CustomerDataService,
    private fileSystemService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private sanitizer: DomSanitizer,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    this.filterSubscription = this.filter.valueChanges.subscribe((data) => {
      this.dataToBeShown = this.search(data);
    });
  }

  ngOnInit(): void {
    this.loggerService.LogInfo('getAllCustomers() Request Started From select-customer component.');
    this.loaderService.start();
    this.customerService.getAllCustomers(true, 10, 1, '', true)
      .then((response: any) => {
        for (const customer of response) {
          if (customer.imagePath) {
            customer.image = this.utilityService.getFilePath(this.fileSystemService.customerImagesDir + '\\' + customer.imagePath);
          } else {
            customer.image = 'assets/img/No-Image-Icon.png';
          }
        }

        this.customersData = [...response];
        this.changeCategoryDataToBeShown();
        this.loaderService.stop();
        this.loggerService.LogInfo('getAllCustomers() Request Completed From select-customer component.');
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'getAllCustomers() From select-customer component');
        this.loaderService.stop();
      });

    this.selectCustomerSubscription = this.selectCustomer.valueChanges.subscribe((data: any) => {
      const selectedCustomerData = this.customersData.find(customer => customer.id === data.selectedCustomerId);
      this.emitSelectedCustomerData.emit(selectedCustomerData);
    });
  }

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
    this.selectCustomerSubscription?.unsubscribe();
  }

  search(text: string): CustomerDetails[] {
    return this.customersData.filter((customer) => {
      const term = text.toLowerCase();
      return (
        customer.firstName.toLowerCase().includes(term) ||
        customer.lastName.toLowerCase().includes(term) ||
        customer.city.toLowerCase().includes(term) ||
        (customer.phoneNumber).toString().includes(term) ||
        (customer.firstName.toLowerCase() + ' ' + customer.lastName.toLowerCase()).includes(term) ||
        (customer.firstName.toLowerCase() + customer.lastName.toLowerCase()).includes(term)
      );
    });
  }

  onPageChange(event: SimplePageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.changeCategoryDataToBeShown();
  }

  changeCategoryDataToBeShown(): void {
    this.dataToBeShown = this.customersData
      .map((customer: any, i: number) => ({ id: i + 1, ...customer }))
      .slice(
        this.pageIndex * this.pageSize,
        this.pageIndex * this.pageSize + this.pageSize,
      );
  }
}
