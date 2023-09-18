import { Component, OnInit } from '@angular/core';
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
  ) {}

  ngOnInit(): void {
    this.storeService.store.get('authData').then((data: any) => {
      let imagePath:string = ''
      this.userData = {
        displayName: data.userName,
        type: data.type,
        image: imagePath
      };

      this.loggerService.LogInfo("getUserImage() Request Started From sidebar component.")

      this.userService.getUserImage(data.uid).subscribe({
        next: (data:any) => {
          if (data[0].imagePath) {
            imagePath = this.utilityService.getFilePath(
              this.fileSystemService.userImagesDir +
                '\\' +
                data[0].imagePath
            ); 
          }
          this.userData.image = imagePath
          this.loggerService.LogInfo("getUserImage() Request Completed From sidebar component.")
        },
        error: (error) => {
          this.loggerService.LogError(error, "getUserImage() From sidebar component")
        }
      })
    });

    // listen if the user updates their profile image
    this.userService.userImage.subscribe((imagePath:string) => {
      this.userData.image = imagePath
    })

    // listen if the user updates their userName
    this.userService.userName.subscribe((name:string) => {
      this.userData.displayName = name
    })
  }

  public async logout() {
    await this.authService.logout();
  }
}
