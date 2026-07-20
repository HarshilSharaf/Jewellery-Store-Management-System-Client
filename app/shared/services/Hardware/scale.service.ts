import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';

export interface ScalePortInfo {
  path: string;
  manufacturer?: string | null;
  serialNumber?: string | null;
  friendlyName?: string | null;
}

export interface ScaleReading {
  grams: number;
  stable: boolean;
  raw?: string;
  receivedAt?: string;
}

const STORAGE_KEY = 'jsms.scale.config';

interface StoredScaleConfig {
  portPath: string;
  baudRate: number;
}

/**
 * Renderer-side wrapper around the Electron main-process scale bridge
 * (`window.electronAPI.scale.*`). Also acts as the single source of
 * truth for the currently-selected port + baud, persisted to
 * localStorage for v1. If the parent's native `serialport` module
 * failed to load, `available` will be false and the UI should render
 * a disabled state.
 */
@Injectable({ providedIn: 'root' })
export class ScaleService implements OnDestroy {

  private readonly ngZone = inject(NgZone);

  readonly available = signal<boolean>(true);
  readonly isConnected = signal<boolean>(false);
  readonly availablePorts = signal<ScalePortInfo[]>([]);
  readonly currentReading = signal<ScaleReading | null>(null);
  readonly selectedPort = signal<string | null>(null);
  readonly selectedBaud = signal<number>(9600);
  readonly connecting = signal<boolean>(false);
  readonly lastError = signal<string | null>(null);

  private unsubscribeReading: (() => void) | null = null;

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.scale;
  }

  constructor() {
    this.hydrateFromStorage();
    this.bootstrap();
  }

  ngOnDestroy(): void {
    if (this.unsubscribeReading) { this.unsubscribeReading(); this.unsubscribeReading = null; }
  }

  private hydrateFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cfg = JSON.parse(raw) as StoredScaleConfig;
        if (cfg && typeof cfg.portPath === 'string') { this.selectedPort.set(cfg.portPath); }
        if (cfg && typeof cfg.baudRate === 'number') { this.selectedBaud.set(cfg.baudRate); }
      }
    } catch {
      // Ignore corrupt localStorage.
    }
  }

  private persist(): void {
    try {
      const cfg: StoredScaleConfig = {
        portPath: this.selectedPort() ?? '',
        baudRate: this.selectedBaud(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {
      // Ignore quota errors.
    }
  }

  private async bootstrap(): Promise<void> {
    if (!this.api?.getStatus) {
      this.available.set(false);
      return;
    }
    try {
      const status = await this.api.getStatus();
      this.available.set(!!status?.available);
      this.isConnected.set(!!status?.isOpen);
      if (status?.lastReading) { this.currentReading.set(status.lastReading as ScaleReading); }
      this.subscribe();
    } catch (err) {
      this.available.set(false);
      this.lastError.set((err as any)?.message ?? 'Failed to query scale status');
    }
  }

  private subscribe(): void {
    if (this.unsubscribeReading || !this.api?.onReading) { return; }
    this.unsubscribeReading = this.api.onReading((reading: ScaleReading) => {
      this.ngZone.run(() => this.currentReading.set(reading));
    });
  }

  async refreshPorts(): Promise<ScalePortInfo[]> {
    if (!this.api?.listPorts) { return []; }
    try {
      const res = await this.api.listPorts();
      const ports: ScalePortInfo[] = res?.ports ?? [];
      this.availablePorts.set(ports);
      if (!this.selectedPort() && ports.length) { this.selectedPort.set(ports[0].path); }
      return ports;
    } catch (err) {
      this.lastError.set((err as any)?.message ?? 'Failed to list ports');
      return [];
    }
  }

  setPort(portPath: string): void {
    this.selectedPort.set(portPath);
    this.persist();
  }

  setBaud(baud: number): void {
    this.selectedBaud.set(baud);
    this.persist();
  }

  async connect(): Promise<boolean> {
    if (!this.api?.open) { return false; }
    const port = this.selectedPort();
    if (!port) { this.lastError.set('No port selected'); return false; }
    this.connecting.set(true);
    this.lastError.set(null);
    try {
      const result = await this.api.open({ portPath: port, baudRate: this.selectedBaud() });
      if (result?.ok) {
        this.isConnected.set(true);
        this.subscribe();
        this.persist();
        return true;
      }
      this.lastError.set(result?.error ?? 'Failed to open scale');
      return false;
    } catch (err) {
      this.lastError.set((err as any)?.message ?? 'Failed to open scale');
      return false;
    } finally {
      this.connecting.set(false);
    }
  }

  async disconnect(): Promise<void> {
    if (!this.api?.close) { return; }
    try {
      await this.api.close();
    } finally {
      this.isConnected.set(false);
      this.currentReading.set(null);
    }
  }

  async pollOnce(): Promise<ScaleReading | null> {
    if (!this.api?.getReading) { return null; }
    try {
      const r = await this.api.getReading();
      if (r) { this.currentReading.set(r as ScaleReading); }
      return r as ScaleReading | null;
    } catch {
      return null;
    }
  }
}
