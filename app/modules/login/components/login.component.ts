import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideSun,
  lucideMoon,
  lucideArrowRight,
  lucideCircleAlert,
} from '@ng-icons/lucide';
import { AuthService } from '../../../shared/services/Auth/auth.service';
import { ThemeService } from '../../../shared/services/theme.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [FormsModule, ReactiveFormsModule, NgIcon],
  viewProviders: [
    provideIcons({ lucideSun, lucideMoon, lucideArrowRight, lucideCircleAlert }),
  ],
})
export class LoginComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  protected themeService = inject(ThemeService);
  private readonly cdRef = inject(ChangeDetectorRef);

  errorMessage = '';
  showError = false;
  submitting = false;

  form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  private originalBodyBackground = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private loggerService: LoggerService
  ) {}

  ngOnInit(): void {
    this.originalBodyBackground = document.body.style.background;
    document.body.style.background = 'var(--color-bg)';
  }

  login(e: Event): void {
    e.preventDefault();
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.showError = false;
    const { username, password } = this.form.getRawValue();
    this.loggerService.LogInfo('login() Request Started.');
    this.authService.login(username, password)
      .then((response: any) => {
        if (response.status == 200) {
          this.loggerService.LogInfo('login() Request Completed.');
          this.router.navigate(['../dashboard']);
        }
      }).catch((error: any) => {
        this.errorMessage = typeof error === 'string' ? error : (error?.message ?? 'Sign-in failed.');
        this.showError = true;
        this.loggerService.LogError(error, 'login()');
      }).finally(() => {
        this.submitting = false;
        this.cdRef.detectChanges();
      });
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  ngOnDestroy(): void {
    document.body.style.background = this.originalBodyBackground;
  }
}
