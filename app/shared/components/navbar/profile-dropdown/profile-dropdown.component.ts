import { Component, HostListener, Input, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { UserService } from '../../../../modules/profile/services/user.service';
import { AuthService } from '../../../../shared/services/Auth/auth.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideSettings, lucidePower } from '@ng-icons/lucide';


@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideUser, lucideSettings, lucidePower })],
})
export class ProfileDropdownComponent implements OnInit {
  userImage = '';
  isDropdownOpen = false;
  _userID = 0;
  @Input() set userID(data: number) {
    this._userID = data;
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {}

  ngOnInit(): void {
    this.loggerService.LogInfo("getUserImage() Request Started From profile-dropdown component.");
    this.userService.getUserImage(this._userID)
      .then((response: any) => {
        if (response.length > 0 && response[0].imagePath) {
          this.userImage = this.utilityService.getFilePath(
            this.fileSystemService.userImagesDir +
              '\\' +
              response[0].imagePath
          );
        }
        this.loggerService.LogInfo("getUserImage() Request Completed From profile-dropdown component.");
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, "getUserImage() From profile-dropdown component");
      });
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click')
  closeDropdown() {
    this.isDropdownOpen = false;
  }

  goToSettingsPage() {
    this.isDropdownOpen = false;
    this.router.navigate(['settings']);
  }

  goToProfilePage() {
    this.isDropdownOpen = false;
    this.router.navigate(['profile']);
  }

  async logout() {
    this.isDropdownOpen = false;
    await this.authService.logout();
  }
}
