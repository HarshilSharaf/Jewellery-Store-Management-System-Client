import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideIndianRupee, lucideChevronRight, lucideX } from '@ng-icons/lucide';
import Swal from 'sweetalert2';

import { MetalRatesService } from '../../../services/MetalRates/metal-rates.service';
import { MetalRateRow, MetalRateSession, MetalRateUpsertPayload } from '../../../../interfaces/Shared/metal-rate';

interface QuickEditor {
  purityCode: string;
  purityLabel: string;
  am: number | null;
  pm: number | null;
}

const QUICK_PURITIES = ['999', '916', '750'];

@Component({
  selector: 'app-rate-pill',
  templateUrl: './rate-pill.component.html',
  styleUrls: ['./rate-pill.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  viewProviders: [provideIcons({ lucideIndianRupee, lucideChevronRight, lucideX })],
})
export class RatePillComponent implements OnInit {

  readonly open = signal(false);
  readonly editors = signal<QuickEditor[]>([]);
  readonly saving = signal(false);
  readonly session = signal<MetalRateSession>('AM');
  readonly effectiveDate = signal<string>(new Date().toISOString().slice(0, 10));
  readonly loading = signal(true);

  private readonly metalRates = inject(MetalRatesService);
  private readonly router = inject(Router);

  @ViewChild('popover') popoverRef?: ElementRef<HTMLElement>;
  @ViewChild('trigger') triggerRef?: ElementRef<HTMLElement>;

  readonly summary = computed<string>(() => {
    const eds = this.editors();
    const pick = eds.find(e => e.purityCode === '916') ?? eds[0];
    const rate = this.session() === 'PM' ? pick?.pm : pick?.am;
    if (rate == null) { return 'Today\'s rates'; }
    return `${pick.purityLabel} ` + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(rate);
  });

  ngOnInit(): void {
    this.load();
  }

  toggle() {
    if (this.open()) { this.close(); return; }
    this.open.set(true);
    if (this.loading()) { this.load(); }
  }

  close() { this.open.set(false); }

  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent) {
    if (!this.open()) { return; }
    const target = evt.target as Node;
    if (this.popoverRef?.nativeElement.contains(target)) { return; }
    if (this.triggerRef?.nativeElement.contains(target)) { return; }
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape() { if (this.open()) { this.close(); } }

  private async load() {
    this.loading.set(true);
    try {
      const rows = await this.metalRates.getCurrent();
      this.editors.set(this.buildEditors(rows));
    } finally {
      this.loading.set(false);
    }
  }

  private buildEditors(rows: MetalRateRow[]): QuickEditor[] {
    const bySession: Record<MetalRateSession, Record<string, MetalRateRow>> = { AM: {}, PM: {} };
    for (const r of rows) { bySession[r.session][r.purityCode] = r; }
    return QUICK_PURITIES.map((code) => {
      const amRow = bySession.AM[code];
      const pmRow = bySession.PM[code];
      return {
        purityCode: code,
        purityLabel: amRow?.purityLabel ?? pmRow?.purityLabel ?? code,
        am: amRow ? Number(amRow.ratePerGram) : null,
        pm: pmRow ? Number(pmRow.ratePerGram) : null,
      };
    });
  }

  onAmChange(code: string, value: any) {
    this.editors.set(this.editors().map(e => e.purityCode === code ? { ...e, am: value === '' ? null : Number(value) } : e));
  }
  onPmChange(code: string, value: any) {
    this.editors.set(this.editors().map(e => e.purityCode === code ? { ...e, pm: value === '' ? null : Number(value) } : e));
  }

  async save() {
    this.saving.set(true);
    try {
      const date = this.effectiveDate();
      const amRates: MetalRateUpsertPayload[] = this.editors()
        .filter(e => e.am !== null && !Number.isNaN(e.am!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.am) }));
      const pmRates: MetalRateUpsertPayload[] = this.editors()
        .filter(e => e.pm !== null && !Number.isNaN(e.pm!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.pm) }));
      if (amRates.length) {
        await this.metalRates.save({ effectiveDate: date, session: 'AM', source: 'manual', rates: amRates });
      }
      if (pmRates.length) {
        await this.metalRates.save({ effectiveDate: date, session: 'PM', source: 'manual', rates: pmRates });
      }
      Swal.fire({ icon: 'success', title: 'Rates updated', timer: 1400, showConfirmButton: false, toast: true, position: 'top-end' });
      this.close();
    } catch {
      Swal.fire({ icon: 'error', title: 'Failed to save', timer: 1600, showConfirmButton: false, toast: true, position: 'top-end' });
    } finally {
      this.saving.set(false);
    }
  }

  openFullEditor() {
    this.close();
    this.router.navigate(['/settings']);
  }
}
