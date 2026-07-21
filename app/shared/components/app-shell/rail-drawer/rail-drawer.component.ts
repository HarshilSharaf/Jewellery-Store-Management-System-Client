import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
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
  lucideX,
} from '@ng-icons/lucide';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../../services/Auth/auth.service';
import { PermissionsService } from '../../../services/Auth/permissions.service';
import { RailItem, primaryNavItems, settingsNavItem } from '../rail-nav-items';

@Component({
  selector: 'app-rail-drawer',
  templateUrl: './rail-drawer.component.html',
  styleUrls: ['./rail-drawer.component.scss'],
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
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RailDrawerComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionsService);

  @Input() open = false;
  @Output() readonly close = new EventEmitter<void>();

  readonly primary: RailItem[] = primaryNavItems();
  readonly settings: RailItem = settingsNavItem();

  ngOnInit(): void {
    this.permissions.getUserPermissions();
    this.router.events
      .pipe(
        filter(e => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        if (this.open) {
          this.close.emit();
        }
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open) {
      this.close.emit();
    }
  }

  onBackdropClick(): void {
    this.close.emit();
  }

  async logout(): Promise<void> {
    this.close.emit();
    await this.auth.logout();
  }
}
