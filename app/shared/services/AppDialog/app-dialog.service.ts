import { Injectable, signal } from '@angular/core';

export type DialogIcon = 'success' | 'error' | 'warning' | 'info' | 'question';
export type DialogSize = 'sm' | 'md' | 'lg';
export type DialogVariant = 'default' | 'danger';
export type DialogInputKind = 'text' | 'textarea' | 'email' | 'number' | 'password';

export interface DialogOptions {
  title?: string;
  text?: string;
  html?: string;
  icon?: DialogIcon;
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
  showConfirmButton?: boolean;
  input?: DialogInputKind | null;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputValue?: string;
  inputValidator?: (value: string) => string | null;
  preConfirm?: (value: string) => unknown | Promise<unknown>;
  size?: DialogSize;
  variant?: DialogVariant;
  disableBackdropClose?: boolean;
  disableEscape?: boolean;
  timer?: number;
}

export interface DialogResult<T = unknown> {
  isConfirmed: boolean;
  isDismissed: boolean;
  value?: T;
}

interface ActiveDialog {
  options: DialogOptions;
  resolve: (result: DialogResult<unknown>) => void;
  inputValue: string;
  inputError: string | null;
  busy: boolean;
}

@Injectable({ providedIn: 'root' })
export class AppDialogService {
  private readonly state = signal<ActiveDialog | null>(null);

  readonly active = this.state.asReadonly();

  fire<T = unknown>(options: DialogOptions): Promise<DialogResult<T>> {
    if (this.state()) {
      this.state()!.resolve({ isConfirmed: false, isDismissed: true });
    }
    return new Promise<DialogResult<T>>((resolve) => {
      this.state.set({
        options: { size: 'md', variant: 'default', showConfirmButton: true, ...options },
        resolve: resolve as (r: DialogResult<unknown>) => void,
        inputValue: options.inputValue ?? '',
        inputError: null,
        busy: false,
      });
      if (options.timer && !options.showCancelButton) {
        const t = options.timer;
        setTimeout(() => {
          const cur = this.state();
          if (cur && cur.resolve === (resolve as (r: DialogResult<unknown>) => void)) {
            this.state.set(null);
            resolve({ isConfirmed: false, isDismissed: true });
          }
        }, t);
      }
    });
  }

  confirm(title: string, text?: string, opts?: Partial<DialogOptions>): Promise<boolean> {
    return this.fire({
      title,
      text,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes',
      cancelButtonText: 'Cancel',
      ...opts,
    }).then((r) => r.isConfirmed);
  }

  danger(title: string, text?: string, opts?: Partial<DialogOptions>): Promise<boolean> {
    return this.fire({
      title,
      text,
      icon: 'warning',
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      ...opts,
    }).then((r) => r.isConfirmed);
  }

  prompt(title: string, opts?: Partial<DialogOptions>): Promise<string | null> {
    return this.fire<string>({
      title,
      showCancelButton: true,
      input: 'text',
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      ...opts,
    }).then((r) => (r.isConfirmed ? (typeof r.value === 'string' ? r.value : '') : null));
  }

  close(): void {
    const cur = this.state();
    if (!cur) return;
    this.state.set(null);
    cur.resolve({ isConfirmed: false, isDismissed: true });
  }

  isOpen(): boolean {
    return this.state() !== null;
  }

  setInputValue(v: string): void {
    const cur = this.state();
    if (!cur) return;
    this.state.set({ ...cur, inputValue: v, inputError: null });
  }

  async confirmActive(): Promise<void> {
    const cur = this.state();
    if (!cur || cur.busy) return;
    const opts = cur.options;
    const value = opts.input ? cur.inputValue : undefined;
    if (opts.input && opts.inputValidator) {
      const err = opts.inputValidator(cur.inputValue);
      if (err) {
        this.state.set({ ...cur, inputError: err });
        return;
      }
    }
    let finalValue: unknown = value;
    if (opts.preConfirm) {
      this.state.set({ ...cur, busy: true, inputError: null });
      try {
        const returned = await opts.preConfirm(cur.inputValue);
        finalValue = returned === undefined ? value : returned;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const latest = this.state();
        if (latest) {
          this.state.set({ ...latest, busy: false, inputError: msg });
        }
        return;
      }
    }
    this.state.set(null);
    cur.resolve({ isConfirmed: true, isDismissed: false, value: finalValue });
  }

  dismissActive(): void {
    const cur = this.state();
    if (!cur || cur.busy) return;
    this.state.set(null);
    cur.resolve({ isConfirmed: false, isDismissed: true });
  }
}
