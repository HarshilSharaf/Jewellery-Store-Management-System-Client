import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCircleCheck,
  lucideCircleAlert,
  lucideCircleX,
  lucideInfo,
  lucideCircleHelp,
  lucideX,
} from '@ng-icons/lucide';

import { AppDialogService, DialogIcon } from '../../services/AppDialog/app-dialog.service';

@Component({
  selector: 'app-dialog',
  templateUrl: './app-dialog.component.html',
  styleUrls: ['./app-dialog.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideCircleCheck,
      lucideCircleAlert,
      lucideCircleX,
      lucideInfo,
      lucideCircleHelp,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDialogComponent implements AfterViewChecked {
  readonly service = inject(AppDialogService);

  @ViewChild('panel') panelRef?: ElementRef<HTMLDivElement>;
  @ViewChild('firstFocus') firstFocusRef?: ElementRef<HTMLElement>;
  @ViewChild('confirmBtn') confirmBtnRef?: ElementRef<HTMLElement>;

  private previouslyFocused: HTMLElement | null = null;
  private focusedOnce = signal<boolean>(false);

  readonly options = computed(() => this.service.active()?.options ?? null);
  readonly inputValue = computed(() => this.service.active()?.inputValue ?? '');
  readonly inputError = computed(() => this.service.active()?.inputError ?? null);
  readonly busy = computed(() => this.service.active()?.busy ?? false);

  constructor() {
    effect(() => {
      const active = this.service.active();
      if (active) {
        if (typeof document !== 'undefined') {
          this.previouslyFocused = document.activeElement as HTMLElement | null;
        }
        this.focusedOnce.set(false);
      } else if (this.previouslyFocused) {
        try { this.previouslyFocused.focus(); } catch { /* ignore */ }
        this.previouslyFocused = null;
      }
    });
  }

  ngAfterViewChecked(): void {
    if (this.service.active() && !this.focusedOnce()) {
      const el = this.firstFocusRef?.nativeElement ?? this.confirmBtnRef?.nativeElement;
      if (el) {
        try { el.focus(); this.focusedOnce.set(true); } catch { /* ignore */ }
      }
    }
  }

  iconName(icon: DialogIcon | undefined): string | null {
    switch (icon) {
      case 'success': return 'lucideCircleCheck';
      case 'error': return 'lucideCircleX';
      case 'warning': return 'lucideCircleAlert';
      case 'info': return 'lucideInfo';
      case 'question': return 'lucideCircleHelp';
      default: return null;
    }
  }

  iconVariantClass(icon: DialogIcon | undefined): string {
    switch (icon) {
      case 'success': return 'app-dialog-icon--success';
      case 'error': return 'app-dialog-icon--error';
      case 'warning': return 'app-dialog-icon--warning';
      case 'info': return 'app-dialog-icon--info';
      case 'question': return 'app-dialog-icon--question';
      default: return '';
    }
  }

  onBackdropClick(): void {
    const opts = this.options();
    if (!opts || opts.disableBackdropClose || this.busy()) return;
    this.service.dismissActive();
  }

  onCloseClick(): void {
    if (this.busy()) return;
    this.service.dismissActive();
  }

  onConfirmClick(): void {
    void this.service.confirmActive();
  }

  onCancelClick(): void {
    if (this.busy()) return;
    this.service.dismissActive();
  }

  onInputChange(v: string): void {
    this.service.setInputValue(v);
  }

  onInputKeydown(evt: KeyboardEvent): void {
    if (evt.key === 'Enter' && this.options()?.input !== 'textarea') {
      evt.preventDefault();
      this.onConfirmClick();
    }
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscape(evt: KeyboardEvent): void {
    const opts = this.options();
    if (!opts || opts.disableEscape || this.busy()) return;
    evt.preventDefault();
    this.service.dismissActive();
  }

  @HostListener('document:keydown.tab', ['$event'])
  onTab(evt: KeyboardEvent): void {
    if (!this.options()) return;
    const panel = this.panelRef?.nativeElement;
    if (!panel) return;
    const focusables = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (evt.shiftKey) {
      if (document.activeElement === first) {
        evt.preventDefault();
        last.focus();
      }
    } else if (document.activeElement === last) {
      evt.preventDefault();
      first.focus();
    }
  }
}
