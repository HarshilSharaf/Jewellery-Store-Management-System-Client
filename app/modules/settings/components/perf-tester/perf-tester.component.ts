import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlay, lucideChevronDown, lucideChevronRight, lucideCircleX } from '@ng-icons/lucide';
import { PerfTesterService, SeedOpts } from '../../services/perf-tester.service';

interface PresetDef {
  id:    'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  label: string;
  desc:  string;
}

@Component({
  selector:        'app-perf-tester',
  standalone:      true,
  imports:         [NgIcon],
  templateUrl:     './perf-tester.component.html',
  styleUrls:       ['./perf-tester.component.scss'],
  viewProviders:   [provideIcons({ lucidePlay, lucideChevronDown, lucideChevronRight, lucideCircleX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfTesterComponent {

  protected readonly svc = inject(PerfTesterService);

  protected readonly presets: PresetDef[] = [
    { id: 'small',   label: 'Small',    desc: '200 customers · 500 products · 200 invoices (~2 s)' },
    { id: 'medium',  label: 'Medium',   desc: '1 000 customers · 3 000 products · 1 000 invoices (~8 s)' },
    { id: 'large',   label: 'Large',    desc: '3 000 customers · 10 000 products · 3 000 invoices (~25 s)' },
    { id: 'xlarge',  label: 'X-Large',  desc: '3L customers · 50K products · 1L invoices (~1 min)' },
    { id: 'xxlarge', label: 'XX-Large', desc: '30L customers · 1L products · 5L invoices (~5 min)' },
  ];

  protected readonly selectedPreset  = signal<'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge'>('small');
  protected readonly indexPanelOpen  = signal(false);
  protected readonly droppedIndexes  = signal<Set<string>>(new Set());

  // ---- Seed optimisation toggles (all on by default = current best-practice) ---
  protected readonly fastPragmas  = signal(true);
  protected readonly deferIndexes = signal(true);
  protected readonly analyze      = signal(true);

  // ---- derived ---------------------------------------------------------------

  protected readonly progressPercent = computed(() => {
    const p = this.svc.progress();
    if (!p) return 0;
    return Math.round((p.step / p.total) * 100);
  });

  private result = (id: string) => computed(() => this.svc.results().find(r => r.id === id));

  protected readonly w1  = this.result('W1');
  protected readonly w2  = this.result('W2');
  protected readonly r4a = this.result('R4a');
  protected readonly r4b = this.result('R4b');

  protected readonly txSpeedup = computed(() => {
    const a = this.w1(), b = this.w2();
    return (a && b && b.durationMs > 0) ? Math.round(a.durationMs / b.durationMs) : null;
  });

  protected readonly batchSpeedup = computed(() => {
    const a = this.r4a(), b = this.r4b();
    return (a && b && b.durationMs > 0) ? Math.round(a.durationMs / b.durationMs) : null;
  });

  protected readonly droppedCount = computed(() => this.droppedIndexes().size);

  // ---- actions ---------------------------------------------------------------

  protected async run(): Promise<void> {
    const seedOpts: SeedOpts = {
      fastPragmas:  this.fastPragmas(),
      deferIndexes: this.deferIndexes(),
      analyze:      this.analyze(),
    };
    await this.svc.run({
      preset:         this.selectedPreset(),
      droppedIndexes: [...this.droppedIndexes()],
      seedOpts,
    });
  }

  protected async cancel(): Promise<void> {
    await this.svc.cancel();
  }

  protected toggleIndex(name: string): void {
    const next = new Set(this.droppedIndexes());
    next.has(name) ? next.delete(name) : next.add(name);
    this.droppedIndexes.set(next);
  }

  protected isDropped(name: string): boolean {
    return this.droppedIndexes().has(name);
  }

  protected fmt(n: number, decimals = 0): string {
    return n.toLocaleString('en-IN', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
  }
}
