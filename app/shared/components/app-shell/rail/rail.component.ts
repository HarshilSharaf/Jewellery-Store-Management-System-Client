import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideShoppingCart,
  lucidePackage,
  lucideUsers,
  lucideTags,
  lucideSettings,
  lucideLogOut,
} from '@ng-icons/lucide';

import { AuthService } from '../../../services/Auth/auth.service';

interface RailItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-rail',
  templateUrl: './rail.component.html',
  styleUrls: ['./rail.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgIcon],
  viewProviders: [
    provideIcons({
      lucideLayoutDashboard,
      lucideShoppingCart,
      lucidePackage,
      lucideUsers,
      lucideTags,
      lucideSettings,
      lucideLogOut,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly primary: RailItem[] = [
    { label: 'Today',   icon: 'lucideLayoutDashboard', route: '/dashboard' },
    { label: 'Sell',    icon: 'lucideShoppingCart',    route: '/orders' },
    { label: 'Stock',   icon: 'lucidePackage',         route: '/inventory' },
    { label: 'People',  icon: 'lucideUsers',           route: '/customers' },
    { label: 'Catalog', icon: 'lucideTags',            route: '/categories' },
  ];

  readonly settings: RailItem = { label: 'Settings', icon: 'lucideSettings', route: '/settings' };

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
