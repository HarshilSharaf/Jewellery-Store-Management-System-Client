import { inject, Injectable, NgZone, OnDestroy, signal } from '@angular/core';

export interface SeedOpts {
  fastPragmas:  boolean;  // journal=OFF · sync=OFF · FK=OFF · exclusive lock · 200 MB cache
  deferIndexes: boolean;  // drop all idx_* before INSERT, rebuild after
  analyze:      boolean;  // ANALYZE after indexing
}

export interface PerfProgress {
  phase:   'init' | 'seed' | 'indexes' | 'write' | 'read' | 'cleanup';
  step:    number;
  total:   number;
  message: string;
}

export interface BenchmarkResult {
  id:             string;
  name:           string;
  category:       'write' | 'read';
  rowCount:       number;
  durationMs:     number;
  throughput:     number;
  rating:         'fast' | 'ok' | 'slow';
  droppedIndexes: string[];
}

export interface BenchmarkReport {
  completedAt:     string;
  preset:          string;
  droppedIndexes:  string[];
  seedOpts:        SeedOpts;
  results:         BenchmarkResult[];
  totalDurationMs: number;
}

export interface IndexInfo {
  name:       string;
  table_name: string;
}

@Injectable({ providedIn: 'root' })
export class PerfTesterService implements OnDestroy {

  private readonly ngZone = inject(NgZone);

  readonly running  = signal(false);
  readonly progress = signal<PerfProgress | null>(null);
  readonly results  = signal<BenchmarkResult[]>([]);
  readonly report   = signal<BenchmarkReport | null>(null);
  readonly error    = signal<string | null>(null);
  readonly indexes  = signal<IndexInfo[]>([]);

  private readonly unsubs: Array<() => void> = [];

  private get api() {
    const w = typeof window !== 'undefined' ? (window as any) : {};
    return w?.electronAPI?.perfTest as any | undefined;
  }

  constructor() {
    this.registerListeners();
    void this.loadIndexes();
  }

  ngOnDestroy(): void {
    for (const u of this.unsubs) { try { u(); } catch (_) {} }
    this.unsubs.length = 0;
  }

  private registerListeners(): void {
    if (!this.api) return;

    const fns = [
      this.api.onProgress?.((data: PerfProgress) =>
        this.ngZone.run(() => this.progress.set(data))),

      this.api.onResult?.((data: BenchmarkResult) =>
        this.ngZone.run(() => this.results.update(rs => [...rs, data]))),

      this.api.onDone?.((data: BenchmarkReport) =>
        this.ngZone.run(() => {
          this.report.set(data);
          this.running.set(false);
          this.progress.set(null);
        })),

      this.api.onError?.((msg: string) =>
        this.ngZone.run(() => {
          this.error.set(msg);
          this.running.set(false);
          this.progress.set(null);
        })),
    ].filter(Boolean) as Array<() => void>;

    this.unsubs.push(...fns);
  }

  async loadIndexes(): Promise<void> {
    if (!this.api?.listIndexes) return;
    try {
      const list: IndexInfo[] = await this.api.listIndexes();
      this.ngZone.run(() => this.indexes.set(list ?? []));
    } catch (_) { /* non-fatal */ }
  }

  async run(config: { preset: string; droppedIndexes: string[]; seedOpts: SeedOpts }): Promise<void> {
    if (!this.api?.run) return;
    this.results.set([]);
    this.report.set(null);
    this.error.set(null);
    this.progress.set(null);
    this.running.set(true);
    try {
      await this.api.run(config);
    } catch (err: any) {
      this.ngZone.run(() => {
        this.error.set(err?.message ?? 'Unknown error');
        this.running.set(false);
      });
    }
  }

  async cancel(): Promise<void> {
    if (!this.api?.cancel) return;
    try { await this.api.cancel(); } catch (_) {}
    this.ngZone.run(() => {
      this.running.set(false);
      this.progress.set(null);
    });
  }
}
