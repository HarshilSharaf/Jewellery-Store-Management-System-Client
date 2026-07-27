import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLock,
  lucidePackage,
  lucideUsers,
  lucideShoppingCart,
  lucideCheck,
  lucideChevronRight,
  lucideX,
  lucideSparkles,
} from '@ng-icons/lucide';

/**
 * Dashboard first-run setup checklist. Purely DERIVED from real data passed in
 * by the dashboard (rate locked, products exist, customers exist, a sale
 * exists) — there are no stored "done" flags to go stale, and the whole card
 * auto-hides once every step is complete (`allDone`). A manual dismiss is
 * persisted in localStorage for users who want to hide it before finishing.
 *
 * The funnel mirrors the activation path for a jewellery POS: lock a rate ->
 * add stock -> add a customer -> ring up the first sale.
 */
const DISMISS_KEY = 'jsms.onboarding.checklist.dismissed';

@Component({
  selector: 'app-setup-checklist',
  standalone: true,
  host: { '[class.is-hidden]': '!visible()' },
  imports: [CommonModule, RouterLink, NgIcon],
  viewProviders: [
    provideIcons({
      lucideLock,
      lucidePackage,
      lucideUsers,
      lucideShoppingCart,
      lucideCheck,
      lucideChevronRight,
      lucideX,
      lucideSparkles,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible()) {
      <article class="setup-checklist" data-tour="checklist">
        <header class="setup-checklist__head">
          <div class="setup-checklist__title">
            <span class="setup-checklist__icon" aria-hidden="true">
              <ng-icon name="lucideSparkles" size="18"></ng-icon>
            </span>
            <div>
              <p class="setup-checklist__eyebrow" i18n="@@checklist.eyebrow">Get started</p>
              <h2 class="setup-checklist__heading" i18n="@@checklist.heading">Finish setting up your shop</h2>
            </div>
          </div>
          <button type="button" class="setup-checklist__dismiss" (click)="dismiss()"
                  aria-label="Dismiss checklist" i18n-aria-label="@@checklist.dismiss">
            <ng-icon name="lucideX" size="16" aria-hidden="true"></ng-icon>
          </button>
        </header>

        <div class="setup-checklist__progress" role="progressbar"
             [attr.aria-valuenow]="doneCount()" aria-valuemin="0" [attr.aria-valuemax]="total()">
          <div class="setup-checklist__bar">
            <span class="setup-checklist__fill" [style.width.%]="progressPct()"></span>
          </div>
          <span class="setup-checklist__count tabular-nums">{{ doneCount() }}/{{ total() }}</span>
        </div>

        <ul class="setup-checklist__list">
          @for (item of items(); track item.key) {
            <li class="setup-checklist__item" [class.is-done]="item.done">
              <span class="setup-checklist__check" [class.is-done]="item.done" aria-hidden="true">
                @if (item.done) {
                  <ng-icon name="lucideCheck" size="14"></ng-icon>
                } @else {
                  <ng-icon [name]="item.icon" size="14"></ng-icon>
                }
              </span>
              <span class="setup-checklist__label">{{ item.label }}</span>
              @if (!item.done) {
                <a class="setup-checklist__cta" [routerLink]="item.link">
                  <span i18n="@@checklist.do-it">Do it</span>
                  <ng-icon name="lucideChevronRight" size="14" aria-hidden="true"></ng-icon>
                </a>
              } @else {
                <span class="setup-checklist__done-label" i18n="@@checklist.done">Done</span>
              }
            </li>
          }
        </ul>
      </article>
    }
  `,
  styles: [`
    /* The dashboard host (.dash) is a 12-column grid; span the full width and
       drop out of the grid entirely when hidden so no empty gap remains. */
    :host { display: block; grid-column: 1 / -1; }
    :host(.is-hidden) { display: none; }
    .setup-checklist {
      border: 1px solid var(--color-border-subtle);
      background: var(--color-panel);
      border-radius: 0.75rem;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 1px 2px rgba(0,0,0,0.04);
      margin-bottom: 1.25rem;
    }
    .setup-checklist__head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
    }
    .setup-checklist__title { display: flex; align-items: center; gap: 0.75rem; }
    .setup-checklist__icon {
      display: grid; place-items: center; width: 2.25rem; height: 2.25rem;
      border-radius: 0.6rem; color: var(--color-accent);
      background: color-mix(in oklab, var(--color-accent) 12%, transparent);
    }
    .setup-checklist__eyebrow {
      margin: 0; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
      color: var(--color-fg-muted); font-weight: 600;
    }
    .setup-checklist__heading {
      margin: 0; font-size: 1.1rem; color: var(--color-fg);
    }
    .setup-checklist__dismiss {
      display: grid; place-items: center; width: 2rem; height: 2rem; border-radius: 999px;
      color: var(--color-fg-muted); background: transparent; border: none; cursor: pointer;
    }
    .setup-checklist__dismiss:hover { background: var(--color-bg-subtle); color: var(--color-fg); }
    .setup-checklist__progress {
      display: flex; align-items: center; gap: 0.75rem; margin: 1rem 0 0.5rem;
    }
    .setup-checklist__bar {
      flex: 1; height: 6px; border-radius: 999px; overflow: hidden;
      background: var(--color-bg-subtle);
    }
    .setup-checklist__fill {
      display: block; height: 100%; border-radius: 999px; background: var(--color-accent);
      transition: width 240ms ease;
    }
    .setup-checklist__count { font-size: 0.8rem; color: var(--color-fg-muted); }
    .setup-checklist__list { list-style: none; margin: 0.5rem 0 0; padding: 0; }
    .setup-checklist__item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0;
      border-top: 1px solid var(--color-border-subtle);
    }
    .setup-checklist__item:first-child { border-top: none; }
    .setup-checklist__check {
      display: grid; place-items: center; width: 1.6rem; height: 1.6rem; border-radius: 999px;
      border: 1px solid var(--color-border); color: var(--color-fg-muted);
      background: var(--color-bg); flex-shrink: 0;
    }
    .setup-checklist__check.is-done {
      background: var(--color-accent); border-color: var(--color-accent); color: var(--color-accent-fg);
    }
    .setup-checklist__label { flex: 1; font-size: 0.9rem; color: var(--color-fg); }
    .setup-checklist__item.is-done .setup-checklist__label {
      color: var(--color-fg-muted); text-decoration: line-through;
    }
    .setup-checklist__cta {
      display: inline-flex; align-items: center; gap: 0.15rem; font-size: 0.85rem;
      font-weight: 600; color: var(--color-accent); text-decoration: none;
    }
    .setup-checklist__cta:hover { text-decoration: underline; }
    .setup-checklist__done-label { font-size: 0.8rem; color: var(--color-fg-subtle); }
  `],
})
export class SetupChecklistComponent {
  /** True once the dashboard has loaded enough to judge the items. */
  readonly ready = input<boolean>(false);
  readonly rateLocked = input<boolean>(false);
  readonly hasProducts = input<boolean>(false);
  readonly hasCustomers = input<boolean>(false);
  readonly hasSale = input<boolean>(false);

  private readonly _dismissed = signal<boolean>(this.readDismissed());

  readonly items = computed(() => [
    { key: 'rate', label: $localize`:@@checklist.item.rate:Lock today's metal rate`, done: this.rateLocked(), link: '/settings', icon: 'lucideLock' },
    { key: 'product', label: $localize`:@@checklist.item.product:Add your first product`, done: this.hasProducts(), link: '/inventory', icon: 'lucidePackage' },
    { key: 'customer', label: $localize`:@@checklist.item.customer:Add your first customer`, done: this.hasCustomers(), link: '/customers', icon: 'lucideUsers' },
    { key: 'sale', label: $localize`:@@checklist.item.sale:Record your first sale`, done: this.hasSale(), link: '/orders', icon: 'lucideShoppingCart' },
  ]);

  readonly total = computed(() => this.items().length);
  readonly doneCount = computed(() => this.items().filter((i) => i.done).length);
  readonly allDone = computed(() => this.doneCount() === this.total());
  readonly progressPct = computed(() => Math.round((this.doneCount() / this.total()) * 100));
  readonly visible = computed(() => this.ready() && !this._dismissed() && !this.allDone());

  dismiss(): void {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch { /* localStorage unavailable */ }
    this._dismissed.set(true);
  }

  private readDismissed(): boolean {
    try { return localStorage.getItem(DISMISS_KEY) === '1'; } catch { return false; }
  }
}
