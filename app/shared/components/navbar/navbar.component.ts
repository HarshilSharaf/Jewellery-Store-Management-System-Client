import { Component, OnInit, Signal } from '@angular/core';

import { SideBarService } from '../../services/sidebar.service';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { UserService } from '../../../modules/profile/services/user.service';
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
  // Bind the template directly to the UserService signal so profile-page
  // updates propagate to the navbar without a manual refresh.
  readonly userDisplayName: Signal<string>;
  userID = 0;
  isCollapsed = true;

  constructor(
    private appService: SideBarService,
    private storeService: StoreService,
    private userService: UserService
  ) {
    this.userDisplayName = this.userService.userName.asReadonly();
  }

  ngOnInit() {
    this.storeService.get('authData').then((data: any) => {
      // Seed the signal from persisted auth data so the initial paint has
      // the right value; subsequent updates flow via ProfilePage.
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
}
