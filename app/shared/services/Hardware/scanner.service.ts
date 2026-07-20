import { Injectable, NgZone, OnDestroy, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Keyboard-wedge barcode / HUID scanner service.
 *
 * USB scanners emit as HID keyboards: they type the barcode string into
 * whatever element has focus, then submit an Enter. This service detects
 * the "burst" pattern — a sequence of >= 6 characters with < ~50 ms
 * between keys, terminated by Enter — and re-routes it into a Subject
 * that any component can subscribe to.
 *
 * Focus-anywhere semantics: if the active element is a plain text input,
 * textarea, or contenteditable, we skip capture UNLESS that element has
 * `data-accept-scan="1"`. This lets the cart-builder's search input be
 * the scan sink while the rest of the app stays quiet.
 */
@Injectable({ providedIn: 'root' })
export class ScannerService implements OnDestroy {

  private readonly ngZone = inject(NgZone);

  readonly scan$ = new Subject<string>();
  readonly lastScan = signal<string>('');
  readonly enabled = signal<boolean>(true);

  private buffer = '';
  private lastKeyAt = 0;
  private started = false;
  private readonly BURST_MAX_GAP_MS = 50;
  private readonly HUMAN_MAX_GAP_MS = 150;
  private readonly MIN_BURST_LENGTH = 6;

  private readonly handler = (ev: KeyboardEvent) => this.onKeyDown(ev);

  start(): void {
    if (this.started || typeof document === 'undefined') { return; }
    this.ngZone.runOutsideAngular(() => {
      document.addEventListener('keydown', this.handler, true);
    });
    this.started = true;
  }

  stop(): void {
    if (!this.started || typeof document === 'undefined') { return; }
    document.removeEventListener('keydown', this.handler, true);
    this.started = false;
  }

  enable():  void { this.enabled.set(true); }
  disable(): void { this.enabled.set(false); }

  ngOnDestroy(): void { this.stop(); }

  /**
   * Programmatic emit — useful for the settings scan-simulator button so
   * the same code path is exercised from a click as from a real HID
   * burst.
   */
  emit(code: string): void {
    if (!code) { return; }
    this.lastScan.set(code);
    this.scan$.next(code);
  }

  private onKeyDown(ev: KeyboardEvent): void {
    if (!this.enabled()) { return; }
    if (ev.ctrlKey || ev.metaKey || ev.altKey) { return; }

    const target = this.classifyTarget();
    if (target === 'skip') {
      // In a text input / textarea / contenteditable that isn't tagged as
      // a scan sink — leave the user's typing alone.
      this.buffer = '';
      this.lastKeyAt = 0;
      return;
    }

    const now = performance.now();
    const gap = now - this.lastKeyAt;

    if (ev.key === 'Enter') {
      if (this.buffer.length >= this.MIN_BURST_LENGTH) {
        // Consume the Enter so it does not submit a surrounding form or
        // trigger a button-focus click.
        ev.preventDefault();
        ev.stopPropagation();
        const code = this.buffer;
        this.buffer = '';
        this.lastKeyAt = 0;
        this.ngZone.run(() => this.emit(code));
      } else {
        this.buffer = '';
        this.lastKeyAt = 0;
      }
      return;
    }

    if (ev.key.length !== 1) { return; }

    // Human-speed typing resets the buffer.
    if (this.buffer.length > 0 && gap > this.HUMAN_MAX_GAP_MS) {
      this.buffer = '';
    }

    this.buffer += ev.key;
    this.lastKeyAt = now;

    // When focus is nowhere useful (button, body, etc.) suppress the raw
    // chars so they don't accidentally trigger accesskeys or scroll. When
    // focus is on a scan-target input we let the chars land natively so
    // the input's own value stays in sync.
    if (target === 'capture-and-suppress' && gap < this.BURST_MAX_GAP_MS) {
      ev.preventDefault();
      ev.stopPropagation();
    }
  }

  private classifyTarget(): 'capture-and-suppress' | 'capture-passthrough' | 'skip' {
    if (typeof document === 'undefined') { return 'capture-and-suppress'; }
    const el = document.activeElement as HTMLElement | null;
    if (!el) { return 'capture-and-suppress'; }
    const tag = el.tagName;
    const isEditable = el.isContentEditable
      || tag === 'TEXTAREA'
      || (tag === 'INPUT' && this.isTextInput(el as HTMLInputElement));
    if (!isEditable) { return 'capture-and-suppress'; }
    if (el.getAttribute('data-accept-scan') === '1') { return 'capture-passthrough'; }
    return 'skip';
  }

  private isTextInput(input: HTMLInputElement): boolean {
    const type = (input.type || 'text').toLowerCase();
    return type === 'text' || type === 'search' || type === 'email' || type === 'url' || type === 'tel' || type === 'password';
  }
}
