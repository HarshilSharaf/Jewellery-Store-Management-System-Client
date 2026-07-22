import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { MetalRatesService } from '../../../../shared/services/MetalRates/metal-rates.service';
import { PuritiesService } from '../../../../shared/services/Purities/purities.service';
import { MetalRateRow, MetalRateSession, MetalRateUpsertPayload } from '../../../../interfaces/Shared/metal-rate';
import { Purity } from '../../../../interfaces/Shared/purity';

interface PurityRateEditor {
  purityCode: string;
  purityLabel: string;
  am: number | null;
  pm: number | null;
}

@Component({
  selector: 'app-metal-rates-tab',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './metal-rates-tab.component.html',
  styleUrls: ['./metal-rates-tab.component.scss'],
})
export class MetalRatesTabComponent implements OnInit {

  private readonly storeService = inject(StoreService);
  private readonly loggerService = inject(LoggerService);
  private readonly toast = inject(AppToastService);
  private readonly metalRatesService = inject(MetalRatesService);
  private readonly puritiesService = inject(PuritiesService);
  private readonly cdRef = inject(ChangeDetectorRef);

  purities: Purity[] = [];
  rateEditors: PurityRateEditor[] = [];
  rateHistory: MetalRateRow[] = [];
  ratesSaving = false;
  ratesEffectiveDate = new Date().toISOString().slice(0, 10);
  rateHistorySort: 'asc' | 'desc' = 'desc';

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadPurities(),
      this.loadCurrentRates(),
      this.loadRateHistory(),
    ]);
    this.rebuildRateEditors();
    this.cdRef.detectChanges();
  }

  private async loadPurities(): Promise<void> {
    const rows = await this.puritiesService.getPurities();
    this.purities = rows;
  }

  private async loadCurrentRates(): Promise<void> {
    await this.metalRatesService.getCurrent();
  }

  private async loadRateHistory(): Promise<void> {
    const rows = await this.metalRatesService.getHistory(30);
    this.rateHistory = rows;
  }

  private rebuildRateEditors(): void {
    const currentRates = this.metalRatesService.rates();
    const bySession: Record<MetalRateSession, Record<string, number>> = { AM: {}, PM: {} };
    for (const r of currentRates) {
      bySession[r.session] = bySession[r.session] ?? {};
      bySession[r.session][r.purityCode] = Number(r.ratePerGram);
    }
    this.rateEditors = this.purities.map(p => ({
      purityCode: p.code,
      purityLabel: p.label,
      am: bySession.AM[p.code] ?? null,
      pm: bySession.PM[p.code] ?? null,
    }));
  }

  onEffectiveDateChange(value: string): void {
    this.ratesEffectiveDate = value;
  }

  updateRateAm(code: string, value: string): void {
    const editor = this.rateEditors.find(e => e.purityCode === code);
    if (!editor) { return; }
    editor.am = value === '' ? null : Number(value);
  }

  updateRatePm(code: string, value: string): void {
    const editor = this.rateEditors.find(e => e.purityCode === code);
    if (!editor) { return; }
    editor.pm = value === '' ? null : Number(value);
  }

  copyAllAmToPm(): void {
    for (const e of this.rateEditors) { e.pm = e.am; }
  }

  copyPurityAmToPm(code: string): void {
    const editor = this.rateEditors.find(e => e.purityCode === code);
    if (!editor) { return; }
    editor.pm = editor.am;
  }

  async saveRates(): Promise<void> {
    this.ratesSaving = true;
    this.cdRef.detectChanges();
    try {
      const auth: any = await this.storeService.get('authData');
      const setByUserId = Number.isFinite(Number(auth?.uid)) ? Number(auth.uid) : null;
      const date = this.ratesEffectiveDate;

      const amRates: MetalRateUpsertPayload[] = this.rateEditors
        .filter(e => e.am !== null && !Number.isNaN(e.am!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.am) }));
      const pmRates: MetalRateUpsertPayload[] = this.rateEditors
        .filter(e => e.pm !== null && !Number.isNaN(e.pm!))
        .map(e => ({ purityCode: e.purityCode, ratePerGram: Number(e.pm) }));

      if (!amRates.length && !pmRates.length) {
        this.toast.warning('Enter at least one AM or PM rate to save.', 'Nothing to save');
        return;
      }

      if (amRates.length) {
        await this.metalRatesService.save({ effectiveDate: date, session: 'AM', source: 'manual', setByUserId, rates: amRates });
      }
      if (pmRates.length) {
        await this.metalRatesService.save({ effectiveDate: date, session: 'PM', source: 'manual', setByUserId, rates: pmRates });
      }

      // Reload UI state from the DB. Guard against a hung reload keeping the
      // button stuck on "Saving…" — bail with a 5s watchdog and just leave
      // the on-screen values in place; the save itself already succeeded.
      const reload = (async () => {
        await this.loadCurrentRates();
        await this.loadRateHistory();
        this.rebuildRateEditors();
      })();
      const watchdog = new Promise<void>(resolve => setTimeout(resolve, 5000));
      await Promise.race([reload, watchdog]);
      this.toast.success('Rates saved', undefined, { timer: 1400 });
    } catch (err: any) {
      this.loggerService.LogError(err, 'saveRates');
      this.toast.error(err?.message ?? String(err), 'Failed to save rates');
    } finally {
      this.ratesSaving = false;
      this.cdRef.detectChanges();
    }
  }

  sortedHistory(): MetalRateRow[] {
    const dir = this.rateHistorySort;
    const rows = [...this.rateHistory];
    return rows.sort((a, b) => {
      const av = String(a.effectiveDate ?? '');
      const bv = String(b.effectiveDate ?? '');
      return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    });
  }

  toggleHistorySort(): void {
    this.rateHistorySort = this.rateHistorySort === 'asc' ? 'desc' : 'asc';
  }

  purityMetalKind(label: string, code: string): 'gold' | 'silver' | 'platinum' {
    const key = `${label} ${code}`.toLowerCase();
    if (key.includes('plat')) { return 'platinum'; }
    if (key.includes('silver')) { return 'silver'; }
    return 'gold';
  }
}
