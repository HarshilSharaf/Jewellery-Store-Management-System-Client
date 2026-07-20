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
  lucideWrench,
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
      lucideWrench,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly permissions = inject(PermissionsService);

  readonly primary: RailItem[] = [
    { label: $localize`:@@rail.today:Today`,     icon: 'lucideLayoutDashboard', route: '/dashboard' },
    { label: $localize`:@@rail.sell:Sell`,       icon: 'lucideShoppingCart',    route: '/orders' },
    { label: $localize`:@@rail.stock:Stock`,     icon: 'lucidePackage',         route: '/inventory' },
    { label: $localize`:@@rail.people:People`,   icon: 'lucideUsers',           route: '/customers' },
    { label: $localize`:@@rail.schemes:Schemes`, icon: 'lucidePiggyBank',       route: '/saving-schemes' },
    { label: $localize`:@@rail.karigar:Karigar`, icon: 'lucideHammer',          route: '/karigar' },
    { label: $localize`:@@rail.repair:Repair`,   icon: 'lucideWrench',          route: '/repair' },
    { label: $localize`:@@rail.catalog:Catalog`, icon: 'lucideTags',            route: '/categories' },
    { label: $localize`:@@rail.reports:Reports`, icon: 'lucideChartLine',       route: '/reports' },
  ];

  readonly settings: RailItem = { label: $localize`:@@rail.settings:Settings`, icon: 'lucideSettings', route: '/settings' };

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
