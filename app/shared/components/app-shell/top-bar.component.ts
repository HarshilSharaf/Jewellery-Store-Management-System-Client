import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSun, lucideMoon, lucideSearch } from '@ng-icons/lucide';

import { ThemeService } from '../../services/theme.service';
import { ShopSettingsService } from '../../services/ShopSettings/shop-settings.service';
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

  readonly shopName = signal('Radiance');
  readonly searchValue = signal('');
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

  @HostListener('window:keydown.control.k', ['$event'])
  @HostListener('window:keydown.meta.k', ['$event'])
  focusSearch(evt: KeyboardEvent): void {
    evt.preventDefault();
    this.searchRef?.nativeElement.focus();
    this.searchRef?.nativeElement.select();
  }

  onSearchInput(value: string): void {
    this.searchValue.set(value);
  }
}
