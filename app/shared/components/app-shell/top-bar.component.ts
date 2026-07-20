import { ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideMoon, lucideSearch } from '@ng-icons/lucide';

import { ThemeService } from '../../services/theme.service';
import { ShopSettingsService } from '../../services/ShopSettings/shop-settings.service';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { RateTickerComponent } from './rate-ticker/rate-ticker.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { AddToCartComponent } from '../navbar/add-to-cart/add-to-cart.component';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon, RateTickerComponent, UserMenuComponent, AddToCartComponent],
  viewProviders: [provideIcons({ lucideSun, lucideMoon, lucideSearch })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TopBarComponent implements OnInit {
  protected readonly themeService = inject(ThemeService);
  private readonly shopSettings = inject(ShopSettingsService);
  private readonly palette = inject(CommandPaletteService);

  readonly shopName = signal('Radiance');
  readonly isMac = /Mac|iPhone|iPad|iPod/.test(typeof navigator !== 'undefined' ? navigator.platform : '');
  readonly commandHint = computed(() => this.isMac ? '⌘K' : 'Ctrl+K');

  @ViewChild('searchInput') searchRef?: ElementRef<HTMLInputElement>;

  async ngOnInit(): Promise<void> {
    const settings = this.shopSettings.settings() ?? await this.shopSettings.get();
    if (settings?.shopName) {
      this.shopName.set(settings.shopName);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  openPalette(): void {
    this.palette.open();
    // The palette owns focus once open; blur the trigger so the caret does
    // not stay in the top-bar surrogate input.
    this.searchRef?.nativeElement.blur();
  }
}
