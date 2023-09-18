import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfilePageComponent } from './components/profile-page/profile-page.component';
import { ImageUploadComponent } from './components/image-upload/image-upload.component';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/shared/shared.module';


@NgModule({
  declarations: [
    ProfilePageComponent,
    ImageUploadComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ProfileRoutingModule,
    SharedModule
  ]
})
export class ProfileModule { }
