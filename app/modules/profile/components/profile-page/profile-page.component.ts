import { ChangeDetectionStrategy, Component, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucidePencil,
  lucideTrash,
  lucideRotateCcw,
  lucideSave,
  lucideLoader,
  lucideLogOut,
  lucideFileText,
  lucideClock,
} from '@ng-icons/lucide';

import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../../../shared/services/Auth/auth.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UserDetailsModel } from '../../models/user-details-model';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ImageUploadComponent, NgIcon],
  viewProviders: [
    provideIcons({
      lucidePencil,
      lucideTrash,
      lucideRotateCcw,
      lucideSave,
      lucideLoader,
      lucideLogOut,
      lucideFileText,
      lucideClock,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  @ViewChild(ImageUploadComponent) imageUploadComponent!: ImageUploadComponent;

  private readonly loaderService = inject(NgxUiLoaderService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly storeService = inject(StoreService);
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly fileSystemService = inject(FileSystemService);
  private readonly loggerService = inject(LoggerService);
  private readonly utilityService = inject(UtilityService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);

  readonly userDetails = signal<UserDetailsModel | null>(null);
  readonly thumbnail = signal<string>('');
  readonly initialUserImageSrc = signal<string>('');
  readonly isSaving = signal<boolean>(false);

  protected get userCurrentImage(): any { return this.imageUploadComponent?.userPhoto; }

  userDetailsForm!: FormGroup;
  userDetailsFormInitialValues: any;
  private userID!: number;

  readonly roleChipClass = computed(() => {
    const role = (this.userDetails()?.type ?? '').toLowerCase();
    if (role === 'admin')   { return 'role-chip role-chip--admin'; }
    if (role === 'manager') { return 'role-chip role-chip--manager'; }
    return 'role-chip role-chip--employee';
  });

  readonly avatarInitial = computed(() => {
    const name = this.userDetails()?.userName ?? '';
    return name.charAt(0).toUpperCase() || 'U';
  });

  ngOnInit(): void {
    this.storeService.get('authData').then((data: any) => {
      this.userID = Number(data.uid);
      this.getUserDetails();
      this.getUserImage();
    });
  }

  populateUserDetailsForm(userDetails: UserDetailsModel) {
    this.userService.userName.set(userDetails.userName);
    this.userDetails.set(userDetails);
    this.userDetailsForm = this.formBuilder.group({
      userName:        [userDetails.userName, Validators.required],
      email:           [userDetails.email],
      currentPassword: [''],
      password:        [''],
      confirmPassword: [''],
    });
    this.userDetailsFormInitialValues = this.userDetailsForm.value;
  }

  getUserDetails() {
    this.loggerService.LogInfo('getUserDetails() Request Started.');
    this.loaderService.start();
    this.userService
      .getUserDetails(this.userID)
      .then((response: any) => {
        if (response.length > 0) {
          this.populateUserDetailsForm(response[0]);
        }
        this.loaderService.stop();
        this.loggerService.LogInfo('getUserDetails() Request Completed.');
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'getUserDetails()');
        this.loaderService.stop();
      });
  }

  async updateUserDetails() {
    this.loggerService.LogInfo('updateUserDetails() Request Started.');

    const raw = { ...this.userDetailsForm.value };

    // Password change validation: new must match confirm; both empty means no-change.
    if ((raw.password ?? '') !== '' || (raw.confirmPassword ?? '') !== '') {
      if (raw.password !== raw.confirmPassword) {
        this.dialog.fire({ icon: 'error', title: 'Passwords do not match', text: 'New password and confirmation must be identical.' });
        return;
      }
      if ((raw.password ?? '').length < 4) {
        this.dialog.fire({ icon: 'error', title: 'Password too short', text: 'Use at least 4 characters.' });
        return;
      }
    }

    this.isSaving.set(true);
    this.loaderService.start();

    const userDetails: any = {
      uid: this.userID,
      userName: raw.userName,
      email: raw.email,
    };

    if (raw.password && raw.password !== '') {
      userDetails.password = await this.authService.hashPassword(raw.password);
    } else {
      userDetails.password = null;
    }

    this.userService.updateUserDetails(userDetails)
      .then(() => {
        this.toast.success('Profile updated', undefined, { timer: 1400 });

        this.storeService.get('authData').then((data: any) => {
          data.userName = userDetails.userName;
          data.email = userDetails.email;
          this.storeService.set('authData', { ...data }).then(() => {
            this.userService.userName.set(userDetails.userName);
          });
        });
        this.loggerService.LogInfo('updateUserDetails() Request Completed.');
        this.getUserDetails();
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'updateUserDetails()');
        this.dialog.fire({ icon: 'error', title: 'Failed', text: `Error occured to update details: ${error}` });
      })
      .finally(() => {
        this.loaderService.stop();
        this.isSaving.set(false);
      });
  }

  getUserImage() {
    this.loggerService.LogInfo('getUserImage() Request Started From profile-page component.');
    this.loaderService.start();
    this.userService
      .getUserImage(this.userID)
      .then(async (response: any) => {
        let src = '';
        if (response[0]?.imagePath) {
          src = await this.fileSystemService.getUserImageInBase64(response[0].imagePath);
        }
        this.thumbnail.set(src);
        this.initialUserImageSrc.set(src);
        if (this.imageUploadComponent) { this.imageUploadComponent.imageSrc = src; }
        this.userService.userImage.set(src);
        this.loaderService.stop();
        this.loggerService.LogInfo('getUserImage() Request Completed From profile-page component.');
      })
      .catch((error: any) => {
        this.loaderService.stop();
        this.loggerService.LogError(error, 'getUserImage() From profile-page component');
      });
  }

  updateUserImage() {
    this.loggerService.LogInfo('updateUserImage() Request Started.');
    this.loaderService.start();
    const formData = {
      uid: this.userID,
      image: this.imageUploadComponent.userPhoto?.name ?? null,
    };
    this.userService.updateUserImage(formData)
      .then(async (response: any) => {
        if (response[0]?.imagePath) {
          await this.fileSystemService.updateUserImage(
            response[0].oldFileName,
            response[0].imagePath,
            this.imageUploadComponent.userPhoto,
          );
          this.getUserImage();
        }
        this.loaderService.stop();
        this.loggerService.LogInfo('updateUserImage() Request Completed.');
      })
      .catch((error: any) => {
        this.loggerService.LogError(error, 'updateUserImage()');
        this.loaderService.stop();
        this.dialog.fire({ icon: 'error', title: 'Failed to update image', text: String(error) });
      });
  }

  deleteUserImage() {
    this.dialog.danger('Delete profile photo?', "You won't be able to revert this.", {
      confirmButtonText: 'Yes, delete',
    }).then((confirmed) => {
      if (!confirmed) { return; }
      this.loggerService.LogInfo('deleteUserImage() Request Started.');
      this.userService.deleteUserImage(this.userID)
        .then(async (response: any) => {
          await this.fileSystemService.deleteUserImage(response[0].oldFileName);
          this.getUserImage();
          this.toast.success('Deleted', undefined, { timer: 1200 });
          this.loggerService.LogInfo('deleteUserImage() Request Completed.');
        })
        .catch((error: any) => {
          this.loggerService.LogError(error, 'deleteUserImage()');
          this.dialog.fire({ icon: 'error', title: 'Failed', text: String(error) });
        });
    });
  }

  resetForm() {
    this.userDetailsForm.reset(this.userDetailsFormInitialValues);
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialUserImageSrc();
  }

  async logout() {
    await this.authService.logout();
  }

  formatDate(value: any): string {
    if (!value) { return '—'; }
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) { return '—'; }
      return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return '—'; }
  }
}
