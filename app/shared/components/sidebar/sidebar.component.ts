import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideLayoutDashboard,
  lucideShoppingCart,
  lucideUsers,
  lucidePackage,
  lucideTags,
  lucideSettings,
  lucideLogOut,
} from '@ng-icons/lucide';
import { AuthService } from '../../services/Auth/auth.service';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { UserService } from '../../../modules/profile/services/user.service';
import { FileSystemService } from '../../../../../Backend/Shared/file-system.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideLayoutDashboard,
      lucideShoppingCart,
      lucideUsers,
      lucidePackage,
      lucideTags,
      lucideSettings,
      lucideLogOut,
    }),
  ],
})
export class SidebarComponent implements OnInit {
  userData = {
    displayName: '',
    type: '',
    image: ''
  };
  items = [
    { title: 'Dashboard', link: '/dashboard', icon: 'lucideLayoutDashboard' },
    { title: 'Orders', link: '/orders', icon: 'lucideShoppingCart' },
    { title: 'Customers', link: '/customers', icon: 'lucideUsers' },
    { title: 'Categories', link: '/categories', icon: 'lucideTags' },
    { title: 'Inventory', link: '/inventory', icon: 'lucidePackage' },
  ];

  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private userService: UserService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    effect(() => {
      this.userData.image = this.userService.userImage();
    });

    effect(() => {
      this.userData.displayName = this.userService.userName();
    });
  }

  ngOnInit(): void {
    this.storeService.get('authData').then((data: any) => {
      let imagePath:string = ''
      this.userData = {
        displayName: data.userName,
        type: data.type,
        image: imagePath
      };

      this.loggerService.LogInfo("getUserImage() Request Started From sidebar component.")

      this.userService.getUserImage(data.uid)
        .then((data:any) => {
          if (data[0].imagePath) {
            imagePath = this.utilityService.getFilePath(
              this.fileSystemService.userImagesDir +
                '\\' +
                data[0].imagePath
            );
          }
          this.userData.image = imagePath
          this.userService.userImage.set(imagePath);
          this.loggerService.LogInfo("getUserImage() Request Completed From sidebar component.")
        })
        .catch((error: any) => {
          this.loggerService.LogError(error, "getUserImage() From sidebar component")
        })
    });
  }

  public async logout() {
    await this.authService.logout();
  }
}
