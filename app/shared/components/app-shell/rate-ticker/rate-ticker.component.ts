import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLock, lucideLockOpen } from '@ng-icons/lucide';

import { MetalRatesService } from '../../../services/MetalRates/metal-rates.service';
import { MetalRateRow } from '../../../../interfaces/Shared/metal-rate';

interface TickerPill {
  purityCode: string;
  purityLabel: string;
  ratePerGram: number | null;
  locked: boolean;
}

const TICKER_PURITIES = ['999', '916', '750'];

@Component({
  selector: 'app-rate-ticker',
  templateUrl: './rate-ticker.component.html',
  styleUrls: ['./rate-ticker.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideLock, lucideLockOpen })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RateTickerComponent implements OnInit {
  private readonly metalRates = inject(MetalRatesService);
  private readonly router = inject(Router);

  private readonly _rows = signal<MetalRateRow[]>([]);
  readonly loaded = signal(false);

  readonly pills = computed<TickerPill[]>(() => {
    const rows = this._rows();
    const byCode = new Map<string, MetalRateRow>();
    for (const r of rows) {
      // Prefer the freshest session; PM overrides AM for the same purity.
      const existing = byCode.get(r.purityCode);
      if (!existing || r.session === 'PM') { byCode.set(r.purityCode, r); }
    }
    return TICKER_PURITIES.map((code) => {
      const row = byCode.get(code);
      return {
        purityCode: code,
        purityLabel: row?.purityLabel ?? code,
        ratePerGram: row ? Number(row.ratePerGram) : null,
        locked: !!row,
      };
    });
  });

  async ngOnInit(): Promise<void> {
    const rows = await this.metalRates.getCurrent();
    this._rows.set(rows);
    this.loaded.set(true);
  }

  format(value: number | null): string {
    if (value === null || Number.isNaN(value)) { return '--' ; }
    return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
  }

  onPillClick(): void {
    this.router.navigate(['/settings']);
  }
}
