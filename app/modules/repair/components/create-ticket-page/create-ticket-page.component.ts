import { ChangeDetectorRef, Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideWrench,
  lucideSearch,
  lucideCheck,
  lucideLoader,
  lucideScale,
} from '@ng-icons/lucide';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { RepairService } from '../../../../shared/services/Repair/repair.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { CustomerDataService } from '../../../customers/services/customer-data.service';
import { ImageUploadComponent } from '../../../customers/components/image-upload/image-upload.component';
import { Karigar } from '../../../../interfaces/Karigar/karigar';
import { CreateRepairTicketPayload } from '../../../../interfaces/Repair/repair';

interface CustomerLite {
  customerGuid: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string | number | null;
}

@Component({
  selector: 'app-create-ticket-page',
  templateUrl: './create-ticket-page.component.html',
  styleUrls: ['./create-ticket-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon, ImageUploadComponent],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideWrench,
      lucideSearch,
      lucideCheck,
      lucideLoader,
      lucideScale,
    }),
  ],
})
export class CreateTicketPageComponent implements OnInit {

  @ViewChild(ImageUploadComponent) imageUpload?: ImageUploadComponent;

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly customers = signal<CustomerLite[]>([]);
  readonly customerSearch = signal('');
  readonly selectedCustomer = signal<CustomerLite | null>(null);
  readonly customerDropdownOpen = signal(false);

  readonly karigars = signal<Karigar[]>([]);
  readonly authUsers = signal<Array<{ uid: number; userName: string }>>([]);

  form: FormGroup;

  private customerSearchDebounce: any = null;

  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RepairService);
  private readonly karigarService = inject(KarigarService);
  private readonly customerService = inject(CustomerDataService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly fileSystemService = inject(FileSystemService);
  private readonly toast = inject(AppToastService);
  private readonly cdRef = inject(ChangeDetectorRef);

  constructor() {
    const todayIso = new Date().toISOString().slice(0, 10);
    this.form = this.fb.group({
      customerGuid:        ['', Validators.required],
      receivedByUserId:    [null],
      receivedDateHint:    [todayIso],   // display-only; server stamps NOW()
      itemDescription:     ['', [Validators.required, Validators.maxLength(500)]],
      weight:              [null],
      estimatedCharge:     [null],
      estimatedReturnDate: [''],
      notes:               [''],
      karigarGuid:         [''],
      issueKarigarJob:     [false],
    });
  }

  ngOnInit(): void {
    this.storeService.get('authData').then((auth: any) => {
      if (auth?.uid) {
        this.form.patchValue({ receivedByUserId: auth.uid });
      }
      this.cdRef.detectChanges();
    });
    this.loadKarigars();
    this.loadCustomers('');
  }

  goBack(): void {
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  private async loadKarigars(): Promise<void> {
    try {
      const rows: any[] = await this.karigarService.getAllKarigars(200, 1, '');
      this.karigars.set((rows ?? []).filter((r: any) => r?.karigarGuid) as Karigar[]);
    } catch (error) {
      this.loggerService.LogError(error, 'CreateTicket.loadKarigars');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  private async loadCustomers(searchQuery: string): Promise<void> {
    try {
      const rows: any[] = await this.customerService.getAllCustomers(false, 30, 1, searchQuery, false);
      const list: CustomerLite[] = (rows ?? [])
        .filter((r: any) => r?.customerGuid)
        .map((r: any) => ({
          customerGuid: r.customerGuid,
          firstName: r.firstName,
          lastName: r.lastName,
          phoneNumber: r.phoneNumber,
        }));
      this.customers.set(list);
    } catch (error) {
      this.loggerService.LogError(error, 'CreateTicket.loadCustomers');
    } finally {
      this.cdRef.detectChanges();
    }
  }

  onCustomerSearchInput(value: string): void {
    this.customerSearch.set(value);
    this.customerDropdownOpen.set(true);
    if (this.customerSearchDebounce) clearTimeout(this.customerSearchDebounce);
    this.customerSearchDebounce = setTimeout(() => this.loadCustomers(value.trim()), 200);
  }

  focusCustomerSearch(): void {
    this.customerDropdownOpen.set(true);
    if (!this.customers().length) this.loadCustomers('');
  }

  pickCustomer(c: CustomerLite): void {
    this.selectedCustomer.set(c);
    this.form.patchValue({ customerGuid: c.customerGuid });
    this.customerSearch.set(`${c.firstName} ${c.lastName}`);
    this.customerDropdownOpen.set(false);
  }

  clearCustomer(): void {
    this.selectedCustomer.set(null);
    this.form.patchValue({ customerGuid: '' });
    this.customerSearch.set('');
    this.customerDropdownOpen.set(true);
  }

  displayCustomer(c: CustomerLite): string {
    return `${c.firstName} ${c.lastName} · ${c.phoneNumber ?? '—'}`;
  }

  async save(): Promise<void> {
    if (!this.form.valid) {
      this.form.markAllAsTouched();
      this.errorMessage.set('Fix the highlighted fields.');
      return;
    }
    this.errorMessage.set(null);
    this.saving.set(true);
    try {
      const raw = this.form.value;

      // Photo upload — reuse the customer image directory but with a repair
      // prefix so files don't collide.
      let photoName: string | null = null;
      const photoFile: File | null = this.imageUpload?.customerPhoto ?? null;
      if (photoFile) {
        try {
          photoName = `repair-${Date.now()}.jpg`;
          const dir = this.fileSystemService.customerImagesDir || '';
          const savePath = `${dir}\\${photoName}`;
          const anyFs: any = this.fileSystemService;
          if (typeof anyFs.compressAndSaveImage === 'function') {
            await anyFs.compressAndSaveImage(savePath, photoFile, 'customerImage');
          }
        } catch (photoErr) {
          this.loggerService.LogError(photoErr, 'CreateTicket.savePhoto');
          photoName = null;
        }
      }

      const payload: CreateRepairTicketPayload = {
        customerGuid:        raw.customerGuid,
        receivedByUserId:    raw.receivedByUserId ?? null,
        itemDescription:     raw.itemDescription,
        itemPhotoPath:       photoName,
        weight:              raw.weight ? Number(raw.weight) : null,
        estimatedCharge:     raw.estimatedCharge ? Number(raw.estimatedCharge) : null,
        estimatedReturnDate: raw.estimatedReturnDate || null,
        notes:               raw.notes || null,
        karigarGuid:         raw.karigarGuid || null,
      };

      const rows: any[] = await this.service.create(payload);
      const created = rows.find((r: any) => r?.ticketGuid);

      if (!created) {
        this.errorMessage.set('Server did not return the new ticket. Refresh and check the list.');
        return;
      }

      // Optional: also issue a karigar job now.
      if (raw.karigarGuid && raw.issueKarigarJob && payload.weight) {
        try {
          const auth: any = await this.storeService.get('authData');
          await this.karigarService.issueJob({
            karigarGuid: raw.karigarGuid,
            issuedGrossWeight: Number(payload.weight),
            issuedPurityCode: null,
            issuedStones: [],
            expectedReturnDate: payload.estimatedReturnDate ?? null,
            description: `Repair ticket ${created.ticketNumber} — ${payload.itemDescription.slice(0, 80)}`,
            actorUserId: auth?.uid ?? null,
          });
        } catch (kErr) {
          this.loggerService.LogError(kErr, 'CreateTicket.autoIssueKarigar');
        }
      }

      this.toast.success(created.ticketNumber, 'Ticket created', { timer: 1400 });
      this.router.navigate(['../', created.ticketGuid], { relativeTo: this.route });
    } catch (error) {
      this.loggerService.LogError(error, 'CreateTicket.save');
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.toast.error(msg, 'Error');
    } finally {
      this.saving.set(false);
      this.cdRef.detectChanges();
    }
  }

  descriptionCharsLeft(): number {
    const v = this.form.get('itemDescription')?.value ?? '';
    return 500 - String(v).length;
  }
}
