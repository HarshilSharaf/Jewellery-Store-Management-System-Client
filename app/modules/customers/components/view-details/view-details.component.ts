import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import dayjs from 'dayjs';
import { CustomerDetails } from '../../models/customerDetails';
import { CustomerDataService } from '../../services/customer-data.service';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from '../../../../../../Backend/Shared/utitlity.service';
import { PaymentStatus } from '../../../orders/models/orders-data-model';
import { CustomerOrders } from '../../models/customer-orders';
import { DeleteCustomerImageModel, UpdateCustomerImageModel } from '../../models/customer-image-model';
import { OrderService } from '../../../orders/services/order.service';
import { INDIAN_STATES, GSTIN_REGEX } from '../../../../shared/utils/indian-states';
import { SavingSchemesService } from '../../../../shared/services/SavingSchemes/saving-schemes.service';
import { SavingScheme } from '../../../../interfaces/SavingSchemes/saving-scheme';
import { OldGoldService } from '../../../../shared/services/OldGold/old-gold.service';
import { OldGoldReceipt } from '../../../../interfaces/OldGold/old-gold';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { RepairService } from '../../../../shared/services/Repair/repair.service';
import { RepairTicket } from '../../../../interfaces/Repair/repair';
import { WhatsAppService } from '../../../../shared/services/WhatsApp/whatsapp.service';
import { WhatsappSendLogRow } from '../../../../interfaces/WhatsApp/whatsapp';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucidePencil,
  lucideTrash2,
  lucidePhoneCall,
  lucideMail,
  lucideMapPin,
  lucideSave,
  lucideRotateCcw,
  lucideLoader,
  lucideInbox,
  lucideX,
  lucideCircleCheck,
  lucideCircleX,
  lucideExternalLink,
  lucidePiggyBank,
  lucideCoins,
  lucideWrench,
  lucideMessageCircle,
} from '@ng-icons/lucide';

@Component({
  selector: 'app-view-details',
  templateUrl: './view-details.component.html',
  styleUrls: ['./view-details.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucidePencil,
      lucideTrash2,
      lucidePhoneCall,
      lucideMail,
      lucideMapPin,
      lucideSave,
      lucideRotateCcw,
      lucideLoader,
      lucideInbox,
      lucideX,
      lucideCircleCheck,
      lucideCircleX,
      lucideExternalLink,
      lucidePiggyBank,
      lucideCoins,
      lucideWrench,
      lucideMessageCircle,
    }),
  ],
  providers: [DecimalPipe],
})
export class ViewDetailsComponent implements OnInit, OnDestroy {
  thumbnail: any;
  public isLoading = false;
  private customerGuid = '';

  @ViewChild(ImageUploadComponent) imageUploadComponent?: ImageUploadComponent;
  protected initialCustomerImageSrc: any;

  private readonly destroyRef = inject(DestroyRef);
  private readonly cdRef = inject(ChangeDetectorRef);

  customerDetailsForm!: FormGroup;
  customerDetailsFormInitialValues: any;
  customer: CustomerDetails | null = null;

  totalAmount = 0;
  totalOrders = 0;
  lastVisit: string | null = null;
  customerOrdersData: CustomerOrders[] = [];
  isLoadingOrders = false;

  editMode = false;
  showImageEditor = false;
  readonly permissions = inject(PermissionsService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  creditBalance = 0;
  customerSchemes: SavingScheme[] = [];
  oldGoldReceipts: OldGoldReceipt[] = [];
  isLoadingOldGold = false;
  repairTickets: RepairTicket[] = [];
  isLoadingRepair = false;
  whatsappHistory: WhatsappSendLogRow[] = [];

  protected readonly states = INDIAN_STATES;
  protected readonly gstinPattern = GSTIN_REGEX;

  constructor(
    private customerDataService: CustomerDataService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private formBuilder: FormBuilder,
    private fileSystemService: FileSystemService,
    private loaderService: NgxUiLoaderService,
    private loggerService: LoggerService,
    private orderService: OrderService,
    private router: Router,
    private decimalPipe: DecimalPipe,
    private utilityService: UtilityService,
    private savingSchemesService: SavingSchemesService,
    private oldGoldService: OldGoldService,
    private repairService: RepairService,
    private whatsappService: WhatsAppService,
  ) {}

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.customerGuid = params['customerGuid'];
      this.getCustomerDetails();
      this.getCustomerOrders();
      this.getCustomerImage();
      this.getTotalAmountOfProductsBoughtForCustomer();
      this.getCustomerSchemes();
      this.getCustomerOldGoldReceipts();
      this.getCustomerRepairTickets();
      this.getCustomerWhatsappHistory();
    });
  }

  async getCustomerRepairTickets(): Promise<void> {
    if (!this.customerGuid) return;
    this.isLoadingRepair = true;
    try {
      const list = await this.repairService.getByCustomer(this.customerGuid);
      this.repairTickets = Array.isArray(list) ? list.filter((r: any) => r?.ticketGuid) : [];
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerRepairTickets()');
    } finally {
      this.isLoadingRepair = false;
      this.cdRef.detectChanges();
    }
  }

  async getCustomerWhatsappHistory(): Promise<void> {
    if (!this.customerGuid) return;
    try {
      const list = await this.whatsappService.getByCustomer(this.customerGuid);
      this.whatsappHistory = Array.isArray(list) ? list.filter((r: any) => r?.sendGuid) : [];
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerWhatsappHistory()');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  goToRepair(t: RepairTicket): void {
    if (!t?.ticketGuid) return;
    this.router.navigate(['/repair', t.ticketGuid]);
  }

  goToWhatsappInvoice(row: WhatsappSendLogRow): void {
    if (!row?.invoiceGuid) return;
    this.router.navigate(['orders/view-order-details', row.invoiceGuid]);
  }

  repairStatusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  whatsappStatusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  truncateDesc(desc: string | undefined, len = 40): string {
    if (!desc) return '—';
    return desc.length > len ? desc.slice(0, len) + '…' : desc;
  }

  async getCustomerOldGoldReceipts(): Promise<void> {
    if (!this.customerGuid) { return; }
    this.isLoadingOldGold = true;
    try {
      this.oldGoldReceipts = await this.oldGoldService.getReceiptsByCustomer(this.customerGuid);
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerOldGoldReceipts()');
    } finally {
      this.isLoadingOldGold = false;
      this.cdRef.detectChanges();
    }
  }

  goToOldGoldInvoice(receipt: OldGoldReceipt): void {
    if (!receipt?.invoiceGuid) { return; }
    this.router.navigate([`orders/view-order-details/${receipt.invoiceGuid}`]);
  }

  async getCustomerSchemes(): Promise<void> {
    try {
      const list = await this.savingSchemesService.getByCustomer(this.customerGuid);
      this.customerSchemes = Array.isArray(list) ? list : [];
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerSchemes()');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  goToScheme(scheme: SavingScheme): void {
    if (!scheme?.schemeGuid) return;
    this.router.navigate(['/saving-schemes', scheme.schemeGuid]);
  }

  schemeStatusClass(status: string | undefined): string {
    return status ? `status-chip status-chip--${status}` : 'status-chip';
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  populateCustomerDetailsForm(customerDetails: CustomerDetails): void {
    this.customer = customerDetails;
    this.customer.customerName = `${customerDetails.firstName ?? ''} ${customerDetails.lastName ?? ''}`.trim();
    this.customerDetailsForm = this.formBuilder.group({
      firstName: [customerDetails.firstName, Validators.required],
      lastName: [customerDetails.lastName, Validators.required],
      dob: [this.formatDate(customerDetails.dateOfBirth ? new Date(customerDetails.dateOfBirth) : new Date())],
      gender: [customerDetails.gender ?? 'female'],
      address: [customerDetails.address ?? ''],
      email: [customerDetails.email ?? ''],
      phone: [customerDetails.phoneNumber, Validators.required],
      city: [customerDetails.city, Validators.required],
      state: [customerDetails.state ?? ''],
      stateCode: [customerDetails.stateCode ?? ''],
      gstin: [customerDetails.gstin ?? '', [Validators.pattern(this.gstinPattern)]],
      pan: [customerDetails.pan ?? ''],
      remarks: [customerDetails.remarks ?? ''],
    });
    this.creditBalance = Number(customerDetails.creditBalance ?? 0);
    this.customerDetailsFormInitialValues = this.customerDetailsForm.value;
  }

  onStateChange(code: string): void {
    const match = this.states.find((s) => s.code === code || s.name === code);
    if (match) {
      this.customerDetailsForm.patchValue({ stateCode: match.code });
    }
  }

  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode && this.customerDetailsForm) {
      this.customerDetailsForm.reset(this.customerDetailsFormInitialValues);
    }
  }

  toggleImageEditor(): void {
    this.showImageEditor = !this.showImageEditor;
  }

  clearImage(): void {
    if (this.imageUploadComponent) {
      this.imageUploadComponent.imageSrc = this.initialCustomerImageSrc ?? '';
    }
  }

  async callCustomer(): Promise<void> {
    if (this.customer?.phoneNumber) {
      window.location.href = `tel:${this.customer.phoneNumber}`;
    }
  }

  async getTotalAmountOfProductsBoughtForCustomer(): Promise<void> {
    try {
      const response: any = await this.customerDataService.getTotalAmountOfProductsBoughtForCustomer(this.customerGuid);
      this.totalAmount = response[0]?.totalAmount ?? 0;
    } catch (error) {
      this.loggerService.LogError(error, 'getTotalAmountOfProductsBoughtForCustomer()');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async getCustomerImage(): Promise<void> {
    try {
      this.loaderService.start();
      const response = await this.customerDataService.getCustomerImage(this.customerGuid);

      if (response.length > 0 && response[0].imagePath) {
        this.thumbnail = this.utilityService.getFilePath(
          this.fileSystemService.customerImagesDir + '\\' + response[0].imagePath,
        );
      } else {
        this.thumbnail = '';
      }
      this.initialCustomerImageSrc = this.thumbnail;
      if (this.imageUploadComponent) {
        this.imageUploadComponent.imageSrc = this.initialCustomerImageSrc;
      }
    } catch (error) {
      this.thumbnail = '';
      this.initialCustomerImageSrc = '';
      this.loggerService.LogError(error, 'getCustomerImage() From view-customer-details component.');
    } finally {
      this.loaderService.stop();
      this.cdRef.detectChanges();
    }
  }

  async getCustomerDetails(): Promise<void> {
    try {
      this.loaderService.start();
      const response = await this.customerDataService.getCustomerDetails(this.customerGuid);
      this.populateCustomerDetailsForm(response[0]);
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerDetails() from view-customer-details component');
    } finally {
      this.loaderService.stop();
      this.cdRef.detectChanges();
    }
  }

  async updateCustomerImage(): Promise<void> {
    if (!this.imageUploadComponent) return;
    try {
      this.loaderService.start();
      const formData = {
        customerGuid: this.customerGuid,
        image: this.imageUploadComponent.customerPhoto?.name ?? null,
      };
      const data: UpdateCustomerImageModel[] = await this.customerDataService.updateCustomerImage(formData);

      if (data[0].imagePath) {
        await this.fileSystemService.updateCustomerImage(
          data[0].oldFileName,
          data[0].imagePath,
          this.imageUploadComponent.customerPhoto,
        );
        this.getCustomerImage();
      }
    } catch (error) {
      this.loggerService.LogError(error, 'updateCustomerImage()');
      this.dialog.fire({
        icon: 'error',
        title: 'Failed to update image',
        text: (error as any).error?.message ?? 'Please try again.',
      });
    } finally {
      this.loaderService.stop();
      this.cdRef.detectChanges();
    }
  }

  async deleteCustomerImage(): Promise<void> {
    const confirmed = await this.dialog.danger('Delete this photo?', "You won't be able to revert this.", { confirmButtonText: 'Yes, delete' });

    if (!confirmed) return;

    try {
      const data: DeleteCustomerImageModel[] = await this.customerDataService.deleteCustomerPhoto(this.customerGuid);
      await this.fileSystemService.deleteCustomerImage(data[0].oldFileName);
      this.getCustomerImage();
      this.toast.success('Deleted');
    } catch (error) {
      this.loggerService.LogError(error, 'deleteCustomerImage()');
      this.toast.error((error as any).error?.message ?? 'Failed to delete photo.', 'Error');
    }
  }

  resetForm(): void {
    this.customerDetailsForm.reset(this.customerDetailsFormInitialValues);
  }

  async updateCustomerDetails(): Promise<void> {
    try {
      const updateData = { ...this.customerDetailsForm.value };
      updateData.customerGuid = this.customerGuid;
      this.isLoading = true;
      await this.customerDataService.updateCustomerDetails(updateData);
      this.isLoading = false;
      this.editMode = false;
      this.getCustomerDetails();
      this.toast.success('Customer details updated.', 'Saved');
    } catch (error) {
      this.loggerService.LogError(error, 'updateCustomerDetails()');
      this.isLoading = false;
      this.dialog.fire({ icon: 'error', title: 'Update failed', text: error as string });
    } finally {
      this.cdRef.detectChanges();
    }
  }

  async deleteCustomer(): Promise<void> {
    if (!this.customer) return;
    const confirmed = await this.dialog.danger(`Delete ${this.customer.customerName}?`, "You won't be able to revert this.", { confirmButtonText: 'Yes, delete' });

    if (!confirmed) return;

    try {
      await this.customerDataService.deleteCustomer(this.customerGuid);
      this.toast.success('Customer removed.', 'Deleted');
      this.router.navigate(['../'], { relativeTo: this.route });
    } catch (error) {
      this.loggerService.LogError(error, 'deleteCustomer()');
      this.toast.error(error as string, 'Error');
    }
  }

  protected async getCustomerOrders(): Promise<void> {
    try {
      this.isLoadingOrders = true;
      const res: any = await this.customerDataService.getCustomerOrders(this.customerGuid, 10, 1, '');
      const rows = res.slice(1);
      this.customerOrdersData = this.prepareCustomerOrdersData(rows);
      this.totalOrders = res[0]?.totalRecords ?? this.customerOrdersData.length;
      this.lastVisit = this.customerOrdersData[0]?.orderDate
        ? dayjs(this.customerOrdersData[0].orderDate).format('D MMM YYYY')
        : null;
    } catch (error) {
      this.loggerService.LogError(error, 'getCustomerOrders()');
    } finally {
      this.isLoadingOrders = false;
      this.cdRef.detectChanges();
    }
  }

  protected prepareCustomerOrdersData(orders: any): CustomerOrders[] {
    return orders.map((order: any) => ({
      orderId: order.orderId ?? order.id,
      orderGuid: order.orderGuid ?? order.invoiceGuid,
      invoiceNumber: order.invoiceNumber,
      numberOfProducts: order.numberOfProducts ?? order.totalLineItems ?? 0,
      orderDate: order.orderDate ?? order.createdAt,
      paymentStatus:
        order.paymentStatus === true || order.isPaymentDone === 1 || order.isPaymentDone === true
          ? PaymentStatus.DONE
          : PaymentStatus.PENDING,
      remarks: order.remarks ?? null,
      totalAmountWithGst: this.decimalPipe.transform(order.totalAmountWithGst ?? order.grandTotal),
      grandTotal: order.grandTotal ?? order.totalAmountWithGst,
      cancelledAt: order.cancelledAt,
    }));
  }

  goToViewOrderDetails(order: CustomerOrders): void {
    this.router.navigate([`orders/view-order-details/${order.orderGuid}`]);
  }

  formatINR(value: number | string | null | undefined): string {
    const num = Number(value ?? 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  }

  formatDateShort(date: Date | string | undefined | null): string {
    if (!date) return '';
    return dayjs(date).format('D MMM YYYY');
  }

  paymentIsDone(status: PaymentStatus): boolean {
    return status === PaymentStatus.DONE;
  }

  isCancelled(order: CustomerOrders): boolean {
    return !!order.cancelledAt;
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

  ngOnDestroy(): void {}
}
