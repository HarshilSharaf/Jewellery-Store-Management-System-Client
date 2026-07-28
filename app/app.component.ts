import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { NgxUiLoaderModule } from 'ngx-ui-loader';

import { TypographyService } from './shared/services/Typography/typography.service';
import { WindowTitlebarComponent } from './shared/components/window-titlebar/window-titlebar.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [RouterOutlet, NgxUiLoaderModule, WindowTitlebarComponent]
})
export class AppComponent implements OnInit {
  title = 'Frontend';

  private readonly typography = inject(TypographyService);

  constructor() { }

  ngOnInit(): void {
    // Mark the document when running inside the frameless Electron window so
    // global styles can reserve room for the custom title bar (see styles.scss
    // `.is-electron`). Absent in a plain browser tab, leaving the web layout
    // untouched.
    if ((window as any).electronAPI?.windowControls) {
      document.documentElement.classList.add('is-electron');
    }

    // Pre-hydration inline script in index.html already set
    // documentElement.dataset.typographyPreset from localStorage — the
    // preset-scoped :root[data-typography-preset="..."] block in styles.scss
    // was matching at first paint. This call layers the inline CSS custom
    // properties on top so any live-preview overrides applied later in the
    // session (or a preset that lacks CSS at first paint due to selector
    // specificity ties) resolve consistently.
    this.typography.hydrate();
  }
}
