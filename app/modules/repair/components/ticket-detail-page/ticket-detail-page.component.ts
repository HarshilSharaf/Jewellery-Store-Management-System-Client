import { Component, DestroyRef, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideWrench,
  lucideLoader,
  lucideCircleCheck,
  lucideCircleAlert,
  lucideTrash2,
  lucideHammer,
  lucidePrinter,
  lucideMessageCircle,
  lucideCheck,
  lucideBan,
  lucideExternalLink,
  lucideEllipsisVertical,
  lucidePackage,
  lucideX,
} from '@ng-icons/lucide';

import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from '../../../../../../Backend/Shared/utitlity.service';
import { RepairService } from '../../../../shared/services/Repair/repair.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { WhatsAppService } from '../../../../shared/services/WhatsApp/whatsapp.service';
import { ShopSettingsService } from '../../../../shared/services/ShopSettings/shop-settings.service';
import {
  RepairPaymentMode,
  RepairStatus,
  RepairTicket,
} from '../../../../interfaces/Repair/repair';
import { Karigar } from '../../../../interfaces/Karigar/karigar';

@Component({
  selector: 'app-ticket-detail-page',
  templateUrl: './ticket-detail-page.component.html',
  styleUrls: ['./ticket-detail-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgIcon, DatePipe],
  viewProviders: [
    provideIcons({
      lucideArrowLeft,
      lucideWrench,
      lucideLoader,
      lucideCircleCheck,
      lucideCircleAlert,
      lucideTrash2,
      lucideHammer,
      lucidePrinter,
      lucideMessageCircle,
      lucideCheck,
      lucideBan,
      lucideExternalLink,
      lucideEllipsisVertical,
      lucidePackage,
      lucideX,
    }),
  ],
})
export class TicketDetailPageComponent implements OnInit {

  ticketGuid = '';
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly ticket = signal<RepairTicket | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly userType = signal<string>('employee');

  // Overflow menu (hand-rolled dropdown; closes on document-click + Escape)
  readonly menuOpen = signal(false);
  @ViewChild('menuAnchor') menuAnchor?: ElementRef<HTMLElement>;

  // Status advance panel
  readonly statusPanelOpen = signal(false);
  advanceForm!: FormGroup;

  // Karigar link panel
  readonly karigarPanelOpen = signal(false);
  readonly karigars = signal<Karigar[]>([]);
  linkForm!: FormGroup;

  // WhatsApp send dialog (opens from quick action)
  readonly whatsappDialogOpen = signal(false);
  readonly whatsappConfigured = signal(false);
  whatsappForm!: FormGroup;

  readonly paymentModes: RepairPaymentMode[] = ['cash', 'cheque', 'online'];

  photoSrc: string | null = null;

  private readonly destroyRef = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RepairService);
  private readonly karigarService = inject(KarigarService);
  private readonly whatsappService = inject(WhatsAppService);
  private readonly shopSettingsService = inject(ShopSettingsService);
  private readonly loggerService = inject(LoggerService);
  private readonly storeService = inject(StoreService);
  private readonly fileSystemService = inject(FileSystemService);
  private readonly utilityService = inject(UtilityService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

  ngOnInit(): void {
    this.storeService.get('authData').then((auth: any) => {
      this.userType.set(auth?.type ?? 'employee');
    });
    this.buildForms();
    this.loadKarigars();
    this.checkWhatsappConfig();

    this.route.params.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.ticketGuid = params['ticketGuid'];
      this.loadTicket();
    });
  }

  private buildForms(): void {
    this.advanceForm = this.fb.group({
      notes:         [''],
      actualCharge:  [null],
      paymentMode:   ['cash'],
      paymentRef:    [''],
      deliveredAt:   [new Date().toISOString().slice(0, 16)],
    });

    this.linkForm = this.fb.group({
      karigarGuid: ['', Validators.required],
    });

    this.whatsappForm = this.fb.group({
      phoneNumber:   ['', Validators.required],
      templateName:  ['repair_ready'],
    });
  }

  private async loadKarigars(): Promise<void> {
    try {
      const rows: any[] = await this.karigarService.getAllKarigars(200, 1, '');
      this.karigars.set((rows ?? []).filter((r: any) => r?.karigarGuid) as Karigar[]);
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.loadKarigars');
    }
  }

  private async checkWhatsappConfig(): Promise<void> {
    try {
      const shop = await this.shopSettingsService.get();
      this.whatsappConfigured.set(!!shop?.whatsappEnabled);
    } catch { /* leave default */ }
  }

  async loadTicket(): Promise<void> {
    this.loading.set(true);
    this.errorMessage.set(null);
    try {
      const rows: any[] = await this.service.getDetails(this.ticketGuid);
      const row = Array.isArray(rows) ? rows.find((r: any) => r?.ticketGuid) : null;
      if (!row) {
        this.errorMessage.set('Ticket not found. It may have been deleted.');
        this.ticket.set(null);
        return;
      }
      this.ticket.set(row as RepairTicket);
      this.hydratePhoto(row.itemPhotoPath);
      this.hydrateAdvanceForm(row);
      // Pre-fill customer phone into whatsapp dialog if we ever open it.
      if (row.customerPhone) {
        this.whatsappForm.patchValue({ phoneNumber: String(row.customerPhone) });
      }
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.loadTicket');
      this.errorMessage.set((error as any)?.message ?? String(error));
    } finally {
      this.loading.set(false);
    }
  }

  private hydratePhoto(fileName: string | null | undefined): void {
    if (!fileName) { this.photoSrc = null; return; }
    try {
      this.photoSrc = this.utilityService.getFilePath(
        this.fileSystemService.customerImagesDir + '\\' + fileName,
      );
    } catch { this.photoSrc = null; }
  }

  private hydrateAdvanceForm(row: RepairTicket): void {
    this.advanceForm.patchValue({
      actualCharge: row.actualCharge ?? row.estimatedCharge ?? null,
      paymentMode:  row.paymentMode ?? 'cash',
      paymentRef:   row.paymentRef ?? '',
      notes:        row.notes ?? '',
    });
  }

  daysOpen(): number {
    const t = this.ticket();
    if (!t) return 0;
    const end = t.deliveredAt ? new Date(t.deliveredAt).getTime() : Date.now();
    const start = new Date(t.receivedAt).getTime();
    return Math.max(0, Math.floor((end - start) / (1000 * 60 * 60 * 24)));
  }

  statusClass(): string {
    const s = this.ticket()?.status;
    return s ? `status-chip status-chip--${s}` : 'status-chip';
  }

  statusLabel(status: string | undefined): string {
    switch (status) {
      case 'in_progress': return 'In progress';
      case 'received':    return 'Received';
      case 'ready':       return 'Ready';
      case 'delivered':   return 'Delivered';
      case 'declined':    return 'Declined';
      default:            return status ?? '—';
    }
  }

  advanceLabel(): string {
    const s = this.ticket()?.status;
    if (s === 'received')    return 'Mark in progress';
    if (s === 'in_progress') return 'Mark ready';
    if (s === 'ready')       return 'Settle & deliver';
    return 'Advance status';
  }

  canAdvance(): boolean {
    const s = this.ticket()?.status;
    return s === 'received' || s === 'in_progress' || s === 'ready';
  }

  canDecline(): boolean {
    const s = this.ticket()?.status;
    return s !== 'declined' && s !== 'delivered';
  }

  // Overflow menu handlers.
  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }
  closeMenu(): void { this.menuOpen.set(false); }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.menuOpen()) return;
    const anchor = this.menuAnchor?.nativeElement;
    if (anchor && !anchor.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.menuOpen()) this.closeMenu();
  }

  openAdvance(): void {
    this.hydrateAdvanceForm(this.ticket()!);
    this.statusPanelOpen.set(true);
  }
  closeAdvance(): void { this.statusPanelOpen.set(false); }

  openKarigarLink(): void {
    this.linkForm.patchValue({ karigarGuid: this.ticket()?.karigarGuid ?? '' });
    this.karigarPanelOpen.set(true);
    this.closeMenu();
  }
  closeKarigarLink(): void { this.karigarPanelOpen.set(false); }

  async submitAdvance(): Promise<void> {
    const t = this.ticket(); if (!t) return;
    this.saving.set(true);
    try {
      const auth: any = await this.storeService.get('authData');
      let next: RepairStatus | null = null;
      if (t.status === 'received')    next = 'in_progress';
      else if (t.status === 'in_progress') next = 'ready';
      else if (t.status === 'ready')  next = 'delivered';

      if (!next) return;

      if (next === 'delivered') {
        const raw = this.advanceForm.value;
        const charge = Number(raw.actualCharge ?? 0);
        if (!(charge >= 0)) { this.errorMessage.set('Actual charge is required.'); return; }
        if (raw.paymentMode !== 'cash' && !raw.paymentRef) {
          this.errorMessage.set('Payment reference required for cheque or online.'); return;
        }
        await this.service.settle({
          ticketGuid: t.ticketGuid,
          actualCharge: charge,
          paymentMode: raw.paymentMode,
          paymentRef: raw.paymentRef || null,
          actorUserId: auth?.uid ?? null,
        });
      } else {
        await this.service.updateStatus({
          ticketGuid: t.ticketGuid,
          newStatus: next,
          actorUserId: auth?.uid ?? null,
        });
      }

      this.statusPanelOpen.set(false);
      this.toast.success(`Status updated → ${this.statusLabel(next)}`, undefined, { timer: 1000 });
      this.loadTicket();
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.submitAdvance');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    } finally {
      this.saving.set(false);
    }
  }

  async decline(): Promise<void> {
    this.closeMenu();
    const t = this.ticket(); if (!t) return;
    const confirmed = await this.dialog.danger(
      `Decline ${t.ticketNumber}?`,
      'Marks the ticket declined. This can be a good record of items customers changed their mind on.',
      { confirmButtonText: 'Yes, decline' }
    );
    if (!confirmed) return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.updateStatus({
        ticketGuid: t.ticketGuid,
        newStatus: 'declined',
        actorUserId: auth?.uid ?? null,
      });
      this.toast.success('Declined', undefined, { timer: 900 });
      this.loadTicket();
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.decline');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    }
  }

  async submitKarigarLink(): Promise<void> {
    const t = this.ticket(); if (!t) return;
    if (!this.linkForm.valid) { this.linkForm.markAllAsTouched(); return; }
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.linkToKarigar({
        ticketGuid: t.ticketGuid,
        karigarGuid: this.linkForm.value.karigarGuid,
        karigarJobGuid: null,
        actorUserId: auth?.uid ?? null,
      });
      this.karigarPanelOpen.set(false);
      this.toast.success('Karigar linked', undefined, { timer: 900 });
      this.loadTicket();
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.submitKarigarLink');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    }
  }

  async deleteTicket(): Promise<void> {
    this.closeMenu();
    const t = this.ticket(); if (!t) return;
    const confirmed = await this.dialog.danger(
      `Delete ${t.ticketNumber}?`,
      'Soft-delete: the ticket disappears from lists but remains in the auditlog.',
      { confirmButtonText: 'Yes, delete' }
    );
    if (!confirmed) return;
    try {
      const auth: any = await this.storeService.get('authData');
      await this.service.delete(t.ticketGuid, auth?.uid ?? null);
      this.toast.success('Deleted', undefined, { timer: 900 });
      this.router.navigate(['/repair']);
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.deleteTicket');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    }
  }

  openWhatsappDialog(): void {
    this.whatsappDialogOpen.set(true);
  }
  closeWhatsappDialog(): void { this.whatsappDialogOpen.set(false); }

  async submitWhatsapp(): Promise<void> {
    const t = this.ticket(); if (!t) return;
    if (!this.whatsappForm.valid) { this.whatsappForm.markAllAsTouched(); return; }
    if (!this.whatsappConfigured()) {
      this.dialog.fire({ icon: 'info', title: 'Not configured', text: 'Set up WhatsApp in Settings → WhatsApp.' });
      return;
    }
    try {
      const auth: any = await this.storeService.get('authData');
      const raw = this.whatsappForm.value;
      const res = await this.whatsappService.send({
        invoiceGuid: null,
        customerGuid: t.customerGuid ?? '',
        templateName: raw.templateName,
        templateLanguage: 'en',
        templateVariables: [
          t.customerName?.split(' ')[0] ?? '',
          t.ticketNumber,
          String(t.actualCharge ?? t.estimatedCharge ?? ''),
        ],
        phoneNumber: raw.phoneNumber,
        sentByUserId: auth?.uid ?? null,
      });
      if (res.ok) {
        this.toast.success('Queued to WhatsApp', undefined, { timer: 1200 });
        this.whatsappDialogOpen.set(false);
      } else if (res.error === 'not_configured') {
        this.dialog.fire({ icon: 'info', title: 'Not configured', text: 'Set up WhatsApp in Settings → WhatsApp.' });
      } else {
        this.toast.error(res.error ?? 'Unknown', 'Send failed');
      }
    } catch (error) {
      this.loggerService.LogError(error, 'TicketDetail.submitWhatsapp');
      this.toast.error((error as any)?.message ?? String(error), 'Error');
    }
  }

  printStub(): void {
    this.toast.info('Ticket receipt printing lands in a follow-up.', 'Print receipt', { timer: 1400 });
  }

  money(v: any): string {
    const n = Number(v ?? 0);
    return Number.isFinite(n) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n) : '0';
  }
}
