import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top-end' | 'top-center' | 'bottom-end';

export interface ToastOptions {
  title?: string;
  text?: string;
  variant?: ToastVariant;
  timer?: number;
  position?: ToastPosition;
}

export interface ToastItem {
  id: number;
  title: string;
  text?: string;
  variant: ToastVariant;
  timer: number;
  position: ToastPosition;
  createdAt: number;
}

const MAX_VISIBLE = 3;

@Injectable({ providedIn: 'root' })
export class AppToastService {
  private readonly toasts = signal<ToastItem[]>([]);
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly items = this.toasts.asReadonly();

  show(options: ToastOptions): number {
    const id = this.nextId++;
    const item: ToastItem = {
      id,
      title: options.title ?? '',
      text: options.text,
      variant: options.variant ?? 'info',
      timer: options.timer ?? 3000,
      position: options.position ?? 'top-end',
      createdAt: Date.now(),
    };
    const current = this.toasts();
    const next = [...current, item];
    while (next.length > MAX_VISIBLE) {
      const removed = next.shift();
      if (removed) {
        const t = this.timers.get(removed.id);
        if (t) { clearTimeout(t); this.timers.delete(removed.id); }
      }
    }
    this.toasts.set(next);
    if (item.timer > 0) {
      const handle = setTimeout(() => this.dismiss(id), item.timer);
      this.timers.set(id, handle);
    }
    return id;
  }

  success(text: string, title?: string, opts?: Partial<ToastOptions>): number {
    return this.show({ title: title ?? text, text: title ? text : undefined, variant: 'success', ...opts });
  }

  error(text: string, title?: string, opts?: Partial<ToastOptions>): number {
    return this.show({ title: title ?? text, text: title ? text : undefined, variant: 'error', timer: 3600, ...opts });
  }

  warning(text: string, title?: string, opts?: Partial<ToastOptions>): number {
    return this.show({ title: title ?? text, text: title ? text : undefined, variant: 'warning', ...opts });
  }

  info(text: string, title?: string, opts?: Partial<ToastOptions>): number {
    return this.show({ title: title ?? text, text: title ? text : undefined, variant: 'info', ...opts });
  }

  dismiss(id?: number): void {
    if (id === undefined) {
      this.toasts().forEach((t) => {
        const h = this.timers.get(t.id);
        if (h) { clearTimeout(h); this.timers.delete(t.id); }
      });
      this.toasts.set([]);
      return;
    }
    const h = this.timers.get(id);
    if (h) { clearTimeout(h); this.timers.delete(id); }
    this.toasts.set(this.toasts().filter((t) => t.id !== id));
  }

  pause(id: number): void {
    const h = this.timers.get(id);
    if (h) { clearTimeout(h); this.timers.delete(id); }
  }

  resume(id: number): void {
    const item = this.toasts().find((t) => t.id === id);
    if (!item || item.timer <= 0 || this.timers.has(id)) return;
    const handle = setTimeout(() => this.dismiss(id), item.timer);
    this.timers.set(id, handle);
  }
}
