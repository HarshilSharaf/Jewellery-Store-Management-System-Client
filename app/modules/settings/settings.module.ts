import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SettingsRoutingModule } from './settings-routing.module';
import { SettingsPageComponent } from './components/settings-page/settings-page.component';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    SettingsPageComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SettingsRoutingModule
  ]
})
export class SettingsModule { }
