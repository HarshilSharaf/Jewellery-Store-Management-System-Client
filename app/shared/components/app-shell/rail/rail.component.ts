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
import { RailItem, primaryNavItems, settingsNavItem } from '../rail-nav-items';

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

  readonly primary: RailItem[] = primaryNavItems();
  readonly settings: RailItem = settingsNavItem();

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
