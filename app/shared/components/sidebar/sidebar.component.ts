import { Component, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
  imports: [CommonModule, RouterModule]
})
export class SidebarComponent implements OnInit {
  userData = {
    displayName: '',
    type: '',
    image: ''
  };
  items = [
    {
      title: 'Dashboard',
      link: '/dashboard',
      icon: 'fa fa-tv',
    },
    {
      title: 'Orders',
      link: '/orders',
      icon: 'fa-solid fa-cash-register fa-lg',
    },
    {
      title: 'Customers',
      link: '/customers',
      icon: 'fa fa-users',
    },
    {
      title: 'Categories',
      link: '/categories',
      icon: 'fa-solid fa-sitemap',
    },
    {
      title: 'Inventory',
      link: '/inventory',
      icon: 'fa-solid fa-warehouse',
    },
    {
      title: 'Employees',
      link: '/employees',
      icon: 'fa-solid fa-people-group',
    },
  ];
  
  constructor(
    private authService: AuthService,
    private storeService: StoreService,
    private userService: UserService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    // Create effects to watch for Signal changes
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
