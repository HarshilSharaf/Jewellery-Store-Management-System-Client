import { Component, OnDestroy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/Auth/auth.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule]
})
export class LoginComponent implements OnInit, OnDestroy {
  credentials = { username: '', password: '' };
  errorMessage = '';
  showError = false;
  private originalBodyBackground = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    this.originalBodyBackground = document.body.style.background;
    document.body.style.background = 'linear-gradient(135deg, #E8EAFF 0%, #F0E6FF 50%, #FFE6F0 100%)';
  }

  login(e: Event): void {
    e.preventDefault();
    this.loggerService.LogInfo('login() Request Started.');
    this.authService.login(this.credentials.username, this.credentials.password)
      .then((response: any) => {
        if (response.status == 200) {
          this.loggerService.LogInfo('login() Request Completed.');
          this.router.navigate(['../dashboard']);
        }
      }).catch((error: any) => {
        this.errorMessage = error;
        this.showError = true;
        this.loggerService.LogError(error, 'login()');
      });
  }

  ngOnDestroy(): void {
    document.body.style.background = this.originalBodyBackground;
  }
}
