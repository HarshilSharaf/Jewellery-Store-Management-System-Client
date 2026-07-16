import { Component, OnInit } from '@angular/core';

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
  userDisplayName = '';
  userID = 0
  
  constructor(
    private appService: SideBarService,
    private storeService: StoreService,
    private userService: UserService
  ) {}
  
  isCollapsed = true;
  
  ngOnInit() {
    this.storeService.get('authData').then((data: any) => {
      this.userDisplayName = data.userName;
      this.userID = data.uid
    });

    // Subscribe to the Signal using effect or watch the signal directly
    this.userDisplayName = this.userService.userName();
  }

  toggleSidebarPin() {
    this.appService.toggleSidebarPin();
  }
  
  toggleSidebar() {
    this.appService.toggleSidebar();
  }
}
