import { AfterContentChecked, AfterContentInit, AfterViewInit, Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from 'src/app/modules/profile/services/user.service';
import { AuthService } from 'src/app/shared/services/Auth/auth.service';
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { FileSystemService } from 'src/app/shared/services/file-system.service';
import { LoggerService } from 'src/app/shared/services/logger.service';


@Component({
  selector: 'app-profile-dropdown',
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss'],
})
export class ProfileDropdownComponent implements OnInit {
  userImage = '';
  _userID = 0
  @Input() set userID(data:number) {
    this._userID = data
  } 

  constructor(
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private fileSystemService:FileSystemService,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    this.loggerService.LogInfo("getUserImage() Request Started From profile-dropdown component.")
    this.userService.getUserImage(this._userID).subscribe({
      next: (response: any) => {
        if (response.length > 0 && response[0].imagePath) {
          this.userImage = convertFileSrc(
            this.fileSystemService.userImagesDir +
              '\\' +
              response[0].imagePath
          );
        }
        this.loggerService.LogInfo("getUserImage() Request Completed From profile-dropdown component.")

      },
      error: (error) => {
        this.loggerService.LogError(error, "getUserImage() From profile-dropdown component")
      }
    })


    this.userService.userImage.subscribe((imagePath: string) => {
      this.userImage = imagePath;
    });
  }

  goToSettingsPage() {
    this.router.navigate(['settings']);
  }

  goToProfilePage() {
    this.router.navigate(['profile']);
  }

  public async logout() {
    await this.authService.logout();
  }
}
