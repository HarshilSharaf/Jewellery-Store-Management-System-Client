import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpResponse } from 'src/app/models/http-response';
import { FileSystemService } from 'src/app/shared/services/file-system.service';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { LoggerService } from 'src/app/shared/services/logger.service';
@Component({
  selector: 'app-add-customer-form',
  templateUrl: './add-customer-form.component.html',
  styleUrls: ['./add-customer-form.component.scss']
})
export class AddCustomerFormComponent implements OnInit, OnDestroy {

  public isLoading: boolean = false;
  public addCustomerResponse: HttpResponse = { status: 0, message: '' }

  @Output() refreshDataSource = new EventEmitter<boolean>();
  @ViewChild(ImageUploadComponent, { static: false }) customerPhotoComponent!: ImageUploadComponent;

  customerDetailsForm: FormGroup

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerDataService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService
  ) {
    this.customerDetailsForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: [this.formatDate(new Date())],
      gender: ['female'],
      address: [''],
      email: [''],
      phoneNumber: ['', Validators.required],
      city: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
  }

  ngOnInit(): void {
  }

  submitForm() {
    this.loggerService.LogInfo("addCustomer() Request Started.")

    const addCustomerFormData:CustomerDetails =  {...this.customerDetailsForm.value}


    addCustomerFormData.imagePath = this.customerPhotoComponent.customerPhoto?.name ?? null

    this.isLoading = true;

    this.customerService.addCustomer(addCustomerFormData).subscribe({
      next: async (data: CustomerDetails[]) => {
        if (data[0].imagePath != null && this.customerPhotoComponent.customerPhoto != null)
        {
          try {
            await this.fileSystemService.saveCustomerImage(this.customerPhotoComponent.customerPhoto, data[0].imagePath)
          } catch (error) {
            this.loggerService.LogError(error as string, "saveCustomerImage() From add-customer component.")
          }
        }
        this.refreshDataSource.emit(true);
        this.addCustomerResponse.status = 200
        this.addCustomerResponse.message = "Customer Added Successfully!"
        this.isLoading = false
        this.loggerService.LogInfo("addCustomer() Request Completed.")
      },
      error: (error) => {
        this.addCustomerResponse.status = 500
        this.addCustomerResponse.message = error
        this.isLoading = false
        this.loggerService.LogError(error, "addCustomer()")
      }
    })
  }

  clearForm() {
    this.customerPhotoComponent.customerPhoto = null
    this.customerPhotoComponent.imageSrc = ''
    this.customerPhotoComponent.imageLoaded = false
    this.isLoading = false
    this.addCustomerResponse = { status: 0, message: '' }
  }

  private formatDate(date: Date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
}
