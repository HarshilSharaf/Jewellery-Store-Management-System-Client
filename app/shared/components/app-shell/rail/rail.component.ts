import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
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
  lucidePiggyBank,
  lucideHammer,
  lucideChartLine,
} from '@ng-icons/lucide';

import { AuthService } from '../../../services/Auth/auth.service';
import { PermissionsService } from '../../../services/Auth/permissions.service';

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
      lucidePiggyBank,
      lucideHammer,
      lucideChartLine,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly permissions = inject(PermissionsService);

  readonly primary: RailItem[] = [
    { label: 'Today',   icon: 'lucideLayoutDashboard', route: '/dashboard' },
    { label: 'Sell',    icon: 'lucideShoppingCart',    route: '/orders' },
    { label: 'Stock',   icon: 'lucidePackage',         route: '/inventory' },
    { label: 'People',  icon: 'lucideUsers',           route: '/customers' },
    { label: 'Schemes', icon: 'lucidePiggyBank',       route: '/saving-schemes' },
    { label: 'Karigar', icon: 'lucideHammer',          route: '/karigar' },
    { label: 'Catalog', icon: 'lucideTags',            route: '/categories' },
    { label: 'Reports', icon: 'lucideChartLine',       route: '/reports' },
  ];

  readonly settings: RailItem = { label: 'Settings', icon: 'lucideSettings', route: '/settings' };

  ngOnInit(): void {
    this.permissions.getUserPermissions();
  }

  async logout(): Promise<void> {
    await this.auth.logout();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
  }
}
