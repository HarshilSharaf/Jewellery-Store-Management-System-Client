import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucideSquare, lucideCopy, lucideX } from '@ng-icons/lucide';

/**
 * Custom title bar for the frameless Electron window. Renders a thin draggable
 * strip with minimize / maximize-restore / close controls in the top-right,
 * replacing the native OS window frame and menu bar.
 *
 * Renders nothing when the window-controls bridge is absent (e.g. running the
 * app in a plain browser tab), so the web build is unaffected.
 */
@Component({
  selector: 'app-window-titlebar',
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideMinus, lucideSquare, lucideCopy, lucideX })],
  template: `
    @if (available) {
      <div class="titlebar">
        <div class="titlebar__controls">
          <button type="button" class="tb-btn" (click)="minimize()"
                  aria-label="Minimize" title="Minimize">
            <ng-icon name="lucideMinus" size="15" aria-hidden="true"></ng-icon>
          </button>
          <button type="button" class="tb-btn" (click)="toggleMaximize()"
                  [attr.aria-label]="isMaximized() ? 'Restore' : 'Maximize'"
                  [title]="isMaximized() ? 'Restore' : 'Maximize'">
            <ng-icon [name]="isMaximized() ? 'lucideCopy' : 'lucideSquare'" size="13" aria-hidden="true"></ng-icon>
          </button>
          <button type="button" class="tb-btn tb-btn--close" (click)="close()"
                  aria-label="Close" title="Close">
            <ng-icon name="lucideX" size="16" aria-hidden="true"></ng-icon>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host { display: contents; }
    .titlebar {
      position: fixed;
      top: 0; left: 0; right: 0;
      height: 32px;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      background: var(--color-panel);
      border-bottom: 1px solid var(--color-border-subtle);
      color: var(--color-fg-muted);
      user-select: none;
      -webkit-app-region: drag;
    }
    .titlebar__controls {
      display: flex;
      height: 100%;
      -webkit-app-region: no-drag;
    }
    .tb-btn {
      width: 46px;
      height: 32px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--color-fg-muted);
      cursor: pointer;
      transition: background-color .12s, color .12s;
    }
    .tb-btn:hover { background: var(--color-bg-subtle); color: var(--color-fg); }
    .tb-btn--close:hover { background: #e81123; color: #fff; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WindowTitlebarComponent implements OnInit, OnDestroy {
  private readonly api: any = (window as any).electronAPI?.windowControls;
  readonly available = !!this.api;
  readonly isMaximized = signal<boolean>(false);
  private cleanup?: () => void;

  async ngOnInit(): Promise<void> {
    if (!this.api) { return; }
    try { this.isMaximized.set(await this.api.isMaximized()); } catch { /* ignore */ }
    this.cleanup = this.api.onMaximizeChange?.((v: boolean) => this.isMaximized.set(v));
  }

  ngOnDestroy(): void {
    this.cleanup?.();
  }

  minimize(): void { this.api?.minimize(); }
  toggleMaximize(): void { this.api?.toggleMaximize(); }
  close(): void { this.api?.close(); }
}
