import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import Swal from 'sweetalert2';
import { SettingsModel } from '../../models/settings-model';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { UtilityService } from 'Backend/Shared/utitlity.service';

@Component({
  selector: 'app-settings-page',
  templateUrl: './settings-page.component.html',
  styleUrls: ['./settings-page.component.scss'],
})
export class SettingsPageComponent implements OnInit,OnDestroy {
  settingsForm!: FormGroup;
  settingsFormInitialValues: any;
  isDefaultSettings = false;
  errorMessageAfterReLaunch:string | null = null
  bodyPadding = document.getElementById('body')?.style.paddingTop
  
  constructor(
    private router: Router,
    private location: Location,
    private fb: FormBuilder,
    private storeService: StoreService,
    private loggerService: LoggerService,
    private utilityService: UtilityService
  ) {
    // Initialize the form with default values and validators
    this.getDBSettings();
  }

  ngOnInit(): void {
    document.body.style.paddingTop = '0px'
    const state:any = this.location.getState();
    this.errorMessageAfterReLaunch = state?.error 
  }

  getDBSettings() {
    this.loggerService.LogInfo("getDBSettings() Request Started.")
    this.storeService.get('currentDbInfo').then((data: SettingsModel) => {
      if (data == null) {
        this.storeService.get('defaultDbInfo')
          .then((defaultData: SettingsModel) => {
            this.isDefaultSettings = true;
            this.populateSettingsForm(defaultData);
          });
      } else {
        this.isDefaultSettings = false;
        this.populateSettingsForm(data);
      }
        this.loggerService.LogInfo("getDBSettings() Request Completed.")
    }).catch((error:any) => {
        this.loggerService.LogError(error, "getDBSettings()")
    })
  }

  populateSettingsForm(settingsData: SettingsModel, setThisToInitalValues = true) {
    this.settingsForm = this.fb.group({
      dbname: [settingsData.DATABASE_NAME, Validators.required],
      port: [
        settingsData.DATABASE_PORT,
        [Validators.required, Validators.min(0), Validators.max(65535)],
      ],
      username: [settingsData.DATABASE_USERNAME, Validators.required],
      password: [settingsData.DATABASE_PASSWORD, Validators.required],
    });

    if(setThisToInitalValues) {
      this.settingsFormInitialValues = this.settingsForm.value;
    }
  }

  goBack() {
    this.location.back();
  }

  saveSettings() {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This will change your database settings',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, proceed!',
    }).then((result) => {
      if (result.isConfirmed) {
        this.loggerService.LogInfo("saveSettings() Request Started.")

        const currentDbInfo: SettingsModel = {
          DATABASE_NAME: this.settingsForm.get('dbname')?.value,
          DATABASE_USERNAME: this.settingsForm.get('username')?.value,
          DATABASE_PASSWORD: this.settingsForm.get('password')?.value,
          DATABASE_PORT: this.settingsForm.get('port')?.value,
          DATABASE_HOST: 'localhost',
          LAST_UPDATED_ON: new Date().toUTCString()
        };

        this.storeService.set('currentDbInfo', currentDbInfo)
          .then(async () => {
            await this.storeService.delete('authData');
            this.loggerService.LogInfo("saveSettings() Request Completed.")

            this.getDBSettings();
            Swal.fire({
              title: 'Settings Saved Successfully!',
              html: `<span class="text-success ">Relaunching App. Please Wait!</span>`,
              timer: 4000,
              timerProgressBar: true,
              allowEscapeKey : false,
              allowOutsideClick: false,
              didOpen: () => {
                Swal.showLoading();
              }
            }).then(async (result) => {
              if (result.dismiss === Swal.DismissReason.timer) {
                try {
                  this.loggerService.LogInfo("Relaunching App!")
                  await this.utilityService.relaunch()
                } catch (error) {
                    this.loggerService.LogError(error as string, "relaunch()")
                    throw error;
                }
              }
            });
          })
          .catch((error: any) => {
            this.loggerService.LogError(error, "saveSettings()")
            Swal.fire(
              'Error!',
              `Error Occured To Save Settings: ${error}`,
              'error'
            );
          });
      }
    });
  }

  resetForm() {
    this.settingsForm.reset(this.settingsFormInitialValues);
    this.isDefaultSettings = false
  }

  resetToDefault() {
    this.storeService.get("defaultDbInfo").then((defaultData:SettingsModel) => {
      this.populateSettingsForm(defaultData, false)
      this.isDefaultSettings = true
      this.settingsForm.markAsDirty()
    })
  }

  // Helper method to get error messages for form controls
  getErrorMessage(controlName: string): string {
    const control = this.settingsForm.get(controlName);
    if (control) {
      if (control.hasError('required')) {
        return 'This field is required';
      }
      if (control.hasError('min') || control.hasError('max')) {
        return 'Invalid port number';
      }
    }

    return '';
  }

  ngOnDestroy(): void {
    document.body.style.paddingTop = this.bodyPadding || '60px'
  }
}
