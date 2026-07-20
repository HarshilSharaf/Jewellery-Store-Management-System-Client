import { Component, OnInit, Signal, inject } from '@angular/core';

import { SideBarService } from '../../services/sidebar.service';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { UserService } from '../../../modules/profile/services/user.service';
import { ThemeService } from '../../services/theme.service';
import { ProfileDropdownComponent } from './profile-dropdown/profile-dropdown.component';
import { AddToCartComponent } from './add-to-cart/add-to-cart.component';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [ProfileDropdownComponent, AddToCartComponent]
})
export class NavbarComponent implements OnInit {
  readonly userDisplayName: Signal<string>;
  userID = 0;
  isCollapsed = true;

  protected themeService = inject(ThemeService);

  constructor(
    private appService: SideBarService,
    private storeService: StoreService,
    private userService: UserService
  ) {
    this.userDisplayName = this.userService.userName.asReadonly();
  }

  ngOnInit() {
    this.storeService.get('authData').then((data: any) => {
      this.userService.userName.set(data.userName);
      this.userID = data.uid;
    });
  }

  toggleSidebarPin() {
    this.appService.toggleSidebarPin();
  }

  toggleSidebar() {
    this.appService.toggleSidebar();
  }

  toggleTheme() {
    this.themeService.toggle();
  }
}
