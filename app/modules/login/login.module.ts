import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { LoginRoutingModule } from './login-routing.module';
import { CompanyLogoComponent } from './components/company-logo/company-logo.component';
import { LoginComponent } from './components/login.component';
import { FormsModule } from '@angular/forms';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { NgParticlesModule } from "ng-particles";

@NgModule({
  declarations: [
    CompanyLogoComponent,
    LoginComponent
  ],
  imports: [
    CommonModule,
    LoginRoutingModule,
    NgbModule,
    FormsModule,
    NgParticlesModule 
  ]
})
export class LoginModule { }
