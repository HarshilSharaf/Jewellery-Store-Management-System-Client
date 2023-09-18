import { Component, OnInit } from '@angular/core';
import { SideBarService } from '../../services/sidebar.service';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { UserService } from '../../../modules/profile/services/user.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
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
    this.storeService.store.get('authData').then((data: any) => {
      this.userDisplayName = data.userName;
      this.userID = data.uid
    });

    this.userService.userName.subscribe((name:string) => {
      this.userDisplayName = name
    })
  }

  toggleSidebarPin() {
    this.appService.toggleSidebarPin();
  }
  toggleSidebar() {
    this.appService.toggleSidebar();
  }
}
