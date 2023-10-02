import { AfterViewChecked, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ImageUploadComponent } from '../image-upload/image-upload.component';
import { Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgxUiLoaderService } from 'ngx-ui-loader';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { UserService } from '../../services/user.service';
import * as bcrypt from 'bcryptjs'
import Swal from 'sweetalert2';
import { UtilityService } from 'Backend/Shared/utitlity.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UserDetailsModel } from '../../models/user-details-model';


@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
})
export class ProfilePageComponent
  implements OnInit, OnDestroy, AfterViewChecked
{
  thumbnail: any;
  public isLoading: boolean = false;
  @ViewChild(ImageUploadComponent) imageUploadComponent!: ImageUploadComponent;
  private getImageSubscription!: Subscription;
  private updateImageSubscription!: Subscription;
  private getUserDetailsSubscription!: Subscription;
  protected userCurrentImage: any;
  protected initialUserImageSrc: any;
  userDetailsForm!: FormGroup;
  userDetailsFormInitialValues: any;
  private userID!: number;
  private saltRounds = 10;
  private salt: any;

  constructor(
    private changeRef: ChangeDetectorRef,
    private loaderService: NgxUiLoaderService,
    private formBuilder: FormBuilder,
    private storeService: StoreService,
    private userService: UserService,
    private fileSystemService: FileSystemService,
    private loggerService: LoggerService,
    private utilityService:  UtilityService
  ) {}

  ngAfterViewChecked(): void {
    this.userCurrentImage = this.imageUploadComponent.userPhoto;
    this.changeRef.detectChanges();
  }

  ngOnInit(): void {
    this.storeService.get('authData').then((data: any) => {
      this.userID = Number(data.uid);
      this.getUserDetails();
      this.getUserImage();
      bcrypt.genSalt().then((salt: any) => {
        this.salt = salt;
      });
    });
  }

  populateUserDetailsForm(userDetails: UserDetailsModel) {
    this.userService.userName.next(userDetails.userName)
    this.userDetailsForm = this.formBuilder.group({
      userName: [userDetails.userName, Validators.required],
      email: [userDetails.email],
      password: [''],
    });
    this.userDetailsFormInitialValues = this.userDetailsForm.value;
  }

  getUserDetails() {
    this.loggerService.LogInfo("getUserDetails() Request Started.")

    this.loaderService.start();
    this.getUserDetailsSubscription = this.userService
      .getUserDetails(this.userID)
      .subscribe({
        next: (response) => {
          if (response.length > 0) {
            this.populateUserDetailsForm(response[0]);
          }
          this.loaderService.stop();
          this.loggerService.LogInfo("getUserDetails() Request Completed.")
        },
        error: (error) => {
          this.loggerService.LogError(error, "getUserDetails()")
          this.loaderService.stop();
        },
      });
  }

  updateUserDetails() {
    this.loggerService.LogInfo("updateUserDetails() Request Started.")

    this.loaderService.start();
    const userDetails = { ...this.userDetailsForm.value };
    if (userDetails.password !== '') {
      //hash password before storing to database
      userDetails.password = bcrypt.hashSync(userDetails.password, this.salt);
    } else {
      userDetails.password = null;
    }

    userDetails.uid = this.userID;

    this.userService.updateUserDetails(userDetails).subscribe({
      next: (response: any) => {
        Swal.fire('Updated!', 'Your details updated successfully!', 'success');

        // update the data in the authData object in the store
        this.storeService.get('authData').then((data: any) => {
          data.userName = userDetails.userName;
          data.email = userDetails.email;
          this.storeService.set('authData', { ...data }).then(() => {
            // emit the new values for the subscribers
            this.userService.userName.next(userDetails.userName);
          });
        });
        this.loggerService.LogInfo("updateUserDetails() Request Completed.")
        this.getUserDetails();
      },
      error: (error) => {
        this.loggerService.LogError(error, "updateUserDetails()")
        this.loaderService.stop();
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          text: `Error occured to update details: ${error}`,
        });
      },
    });
  }
  
  getUserImage() {
    this.loggerService.LogInfo("getUserImage() Request Started From profile-page component.")

    this.loaderService.start();
    this.getImageSubscription = this.userService
      .getUserImage(this.userID)
      .subscribe({
        next: (response: any) => {
          if (response[0].imagePath) {
            this.thumbnail = this.utilityService.getFilePath(
              this.fileSystemService.userImagesDir +
                '\\' +
                response[0].imagePath
            );
            this.initialUserImageSrc = this.thumbnail ?? '';
            this.imageUploadComponent.imageSrc = this.thumbnail;
            this.loaderService.stop();
          }
          else {
            this.initialUserImageSrc =  '';
            this.imageUploadComponent.imageSrc = '';
            this.loaderService.stop()
          }

          // This line of code is updating the userImage which will be subscribed in sidebar and top-navbar
          this.userService.userImage.next(this.initialUserImageSrc);
          this.loggerService.LogInfo("getUserImage() Request Completed From profile-page component.")
          
        },
        error: (error) => {
          this.loaderService.stop();
          this.loggerService.LogError(error, "getUserImage() From profile-page component")
        },
      });
  }

  updateUserImage() {
    this.loggerService.LogInfo("updateUserImage() Request Started.")

    this.loaderService.start()
    const formData =  {
      uid: this.userID,
      image: this.imageUploadComponent.userPhoto?.name ?? null
    }
    this.updateImageSubscription = this.userService.updateUserImage(formData).subscribe({
      next: async(response) =>  {
        
        if(response[0].imagePath) {
          this.fileSystemService.updateUserImage(
            response[0].oldFileName,
            response[0].imagePath,
            this.imageUploadComponent.userPhoto
          ).then(() => {
            this.getUserImage()
            this.loaderService.stop()
          })
        }
        else {
          this.loaderService.stop()
        }
        this.loggerService.LogInfo("updateUserImage() Request Completed.")
      },
      error: (error) => {
        this.loggerService.LogError(error, "updateUserImage()")
        this.loaderService.stop()
        Swal.fire({
          icon: 'error',
          title: 'Failed to update Image!!',
          text: error,
        })
      }
    })
  }

  deleteUserImage() {
    Swal.fire({
      title: `Are you sure you want to delete this image?`,
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo("deleteUserImage() Request Started.")

        this.userService.deleteUserImage(this.userID).subscribe({
          next: async(response:any) => {
            await this.fileSystemService.deleteUserImage(response[0].oldFileName)
            this.loggerService.LogInfo("deleteUserImage() Request Completed.")
            this.getUserImage()
            Swal.fire(
              'Deleted!',
              response.message,
              'success'
            )
          },
          error: (error) => {
            this.loggerService.LogError(error, "deleteUserImage()")
            Swal.fire(
              'Error!',
              error,
              'error'
            )
          }
        })
      }
    }
    )
  }

  resetForm() {
    this.userDetailsForm.reset(this.userDetailsFormInitialValues);
  }

  clearImage() {
    this.imageUploadComponent.imageSrc = this.initialUserImageSrc ?? '';
  }

  ngOnDestroy(): void {
    this.getImageSubscription.unsubscribe();
    this.getUserDetailsSubscription.unsubscribe();
    this.updateImageSubscription?.unsubscribe();
  }
}
