import { Component, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX, lucideLoader, lucideHammer } from '@ng-icons/lucide';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { KarigarService } from '../../../../shared/services/Karigar/karigar.service';
import { Karigar } from '../../../../interfaces/Karigar/karigar';

@Component({
  selector: 'app-karigar-form',
  templateUrl: './karigar-form.component.html',
  styleUrls: ['./karigar-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucideX, lucideLoader, lucideHammer })],
})
export class KarigarFormComponent implements OnChanges {

  @Input() open = false;
  @Input() editing: Karigar | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  readonly saving = signal(false);
  readonly errorMessage = signal<string | null>(null);

  form: FormGroup;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(KarigarService);
  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);

  constructor() {
    this.form = this.fb.group({
      name: ['', Validators.required],
      phone: [''],
      address: [''],
      remarks: [''],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editing']) {
      const k = this.editing;
      this.form.reset({
        name: k?.name ?? '',
        phone: k?.phone ?? '',
        address: k?.address ?? '',
        remarks: k?.remarks ?? '',
      });
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open && !this.saving()) this.requestClose();
  }

  requestClose(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.classList.contains('modal-overlay')) {
      this.requestClose();
    }
  }

  async submitForm(): Promise<void> {
    if (!this.form.valid || this.saving()) return;
    this.errorMessage.set(null);
    this.saving.set(true);
    try {
      const auth: any = await this.storeService.get('authData');
      const value = this.form.value;
      if (this.editing?.karigarGuid) {
        await this.service.updateKarigar({
          karigarGuid: this.editing.karigarGuid,
          name: value.name,
          phone: value.phone || null,
          address: value.address || null,
          remarks: value.remarks || null,
          actorUserId: auth?.uid ?? null,
        });
      } else {
        await this.service.addKarigar({
          name: value.name,
          phone: value.phone || null,
          address: value.address || null,
          remarks: value.remarks || null,
          actorUserId: auth?.uid ?? null,
        });
      }
      this.saving.set(false);
      this.saved.emit();
      this.form.reset({ name: '', phone: '', address: '', remarks: '' });
    } catch (error) {
      this.saving.set(false);
      const msg = (error as any)?.message ?? String(error);
      this.errorMessage.set(msg);
      this.loggerService.LogError(error, 'KarigarForm.submitForm');
    }
  }

  clearForm(): void {
    this.form.reset({ name: '', phone: '', address: '', remarks: '' });
    this.errorMessage.set(null);
  }
}
