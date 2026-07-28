import { ChangeDetectorRef, Component, EventEmitter, HostListener, Input, Output, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideLoader, lucideUser } from '@ng-icons/lucide';
import { HttpResponse } from '../../../../models/http-response';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { INDIAN_STATES, GSTIN_REGEX } from '../../../../shared/utils/indian-states';

@Component({
  selector: 'app-add-customer-form',
  templateUrl: './add-customer-form.component.html',
  styleUrls: ['./add-customer-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideX, lucideLoader, lucideUser })],
})
export class AddCustomerFormComponent {
  public isLoading = false;
  public addCustomerResponse: HttpResponse = { status: 0, message: '' };

  @Input() open = false;

  @Output() closed = new EventEmitter<void>();
  @Output() refreshDataSource = new EventEmitter<boolean>();
  @ViewChild(ImageUploadComponent, { static: false }) customerPhotoComponent!: ImageUploadComponent;

  customerDetailsForm: FormGroup;

  protected readonly states = INDIAN_STATES;
  protected readonly gstinPattern = GSTIN_REGEX;
  private readonly cdRef = inject(ChangeDetectorRef);

  constructor(
    private formBuilder: FormBuilder,
    private customerService: CustomerDataService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
  ) {
    this.customerDetailsForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      dateOfBirth: [this.formatDate(new Date())],
      gender: ['female'],
      phoneNumber: ['', Validators.required],
      email: [''],
      address: [''],
      city: ['', Validators.required],
      state: [''],
      stateCode: [''],
      gstin: ['', [Validators.pattern(this.gstinPattern)]],
      pan: [''],
      remarks: [''],
    });
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

  onStateChange(value: string): void {
    const match = this.states.find((s) => s.name === value);
    if (match) {
      this.customerDetailsForm.patchValue({ stateCode: match.code });
    } else {
      this.customerDetailsForm.patchValue({ stateCode: '' });
    }
  }

  async submitForm(): Promise<void> {
    this.loggerService.LogInfo('addCustomer() Request Started.');

    const addCustomerFormData: CustomerDetails = { ...this.customerDetailsForm.value };
    addCustomerFormData.imagePath = this.customerPhotoComponent?.customerPhoto?.name ?? null;

    this.isLoading = true;

    try {
      const data: CustomerDetails[] = await this.customerService.addCustomer(addCustomerFormData);
      if (data[0].imagePath != null && this.customerPhotoComponent?.customerPhoto != null) {
        try {
          await this.fileSystemService.saveCustomerImage(this.customerPhotoComponent.customerPhoto, data[0].imagePath);
        } catch (error) {
          this.loggerService.LogError(error as string, 'saveCustomerImage() From add-customer component.');
        }
      }
      this.refreshDataSource.emit(true);
      this.addCustomerResponse.status = 200;
      this.addCustomerResponse.message = 'Customer added successfully.';
      this.isLoading = false;
      this.loggerService.LogInfo('addCustomer() Request Completed.');
      setTimeout(() => {
        this.clearForm();
        this.requestClose();
      }, 600);
    } catch (error) {
      this.addCustomerResponse.status = 500;
      this.addCustomerResponse.message = error as string;
      this.isLoading = false;
      this.loggerService.LogError(error, 'addCustomer()');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  clearForm(): void {
    if (this.customerPhotoComponent) {
      this.customerPhotoComponent.customerPhoto = null;
      this.customerPhotoComponent.imageSrc = '';
      this.customerPhotoComponent.imageLoaded = false;
    }
    this.isLoading = false;
    this.addCustomerResponse = { status: 0, message: '' };
    this.customerDetailsForm.reset({
      dateOfBirth: this.formatDate(new Date()),
      gender: 'female',
    });
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();
    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;
    return [year, month, day].join('-');
  }
}
