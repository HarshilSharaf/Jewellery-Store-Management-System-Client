import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronLeft,
  lucideChevronRight,
  lucideSparkles,
  lucideLock,
  lucideStore,
  lucidePartyPopper,
  lucideSun,
  lucideMoon,
  lucideCircleAlert,
} from '@ng-icons/lucide';

import { AuthService } from '../../../../shared/services/Auth/auth.service';
import { ThemeService } from '../../../../shared/services/theme.service';
import { INDIAN_STATES, GSTIN_REGEX } from '../../../../shared/utils/indian-states';
import { OnboardingService } from '../../../../../../Backend/Shared/onboarding.service';
import { ShopSettingsService } from '../../../../../../Backend/Shared/shop-settings.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';
import { ShopSettings } from '../../../../../../Backend/Shared/interfaces/shop-settings';

type StepKey = 'welcome' | 'password' | 'shop' | 'finish';

interface WizardStep {
  key: StepKey;
  label: string;
  icon: string;
}

/** Group validator: newPassword must equal confirmPassword. */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pwd = group.get('newPassword')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return pwd && confirm && pwd !== confirm ? { passwordMismatch: true } : null;
}

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [
    provideIcons({
      lucideCheck,
      lucideChevronLeft,
      lucideChevronRight,
      lucideSparkles,
      lucideLock,
      lucideStore,
      lucidePartyPopper,
      lucideSun,
      lucideMoon,
      lucideCircleAlert,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private onboardingService = inject(OnboardingService);
  private shopSettingsService = inject(ShopSettingsService);
  private storeService = inject(StoreService);
  private loggerService = inject(LoggerService);
  private toast = inject(AppToastService);
  private router = inject(Router);
  protected themeService = inject(ThemeService);

  readonly indianStates = INDIAN_STATES;

  /** Whether the default-admin password step is part of this run. */
  readonly needsPassword = signal<boolean>(true);
  readonly activeStep = signal<number>(0);
  readonly submitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  private authData: { uid: number; userName: string; email: string | null } | null = null;

  /** Steps are assembled from the (conditional) password step. */
  readonly steps = computed<WizardStep[]>(() => {
    const list: WizardStep[] = [
      { key: 'welcome', label: 'Welcome', icon: 'lucideSparkles' },
    ];
    if (this.needsPassword()) {
      list.push({ key: 'password', label: 'Secure account', icon: 'lucideLock' });
    }
    list.push({ key: 'shop', label: 'Shop profile', icon: 'lucideStore' });
    list.push({ key: 'finish', label: 'All set', icon: 'lucidePartyPopper' });
    return list;
  });

  readonly currentKey = computed<StepKey>(() => this.steps()[this.activeStep()]?.key ?? 'welcome');
  readonly isLastStep = computed(() => this.activeStep() === this.steps().length - 1);

  readonly passwordForm = this.fb.nonNullable.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  readonly shopForm = this.fb.group({
    shopName: ['', Validators.required],
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    stateCode: ['', Validators.required],
    pincode: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    phone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{7,20}$/)]],
    email: ['', [Validators.email]],
    gstin: ['', [Validators.required, Validators.pattern(GSTIN_REGEX)]],
    pan: [''],
  });

  async ngOnInit(): Promise<void> {
    // Auto-fill the GST state code from the selected state, mirroring Settings.
    this.shopForm.get('state')?.valueChanges.subscribe((stateName) => {
      const match = this.indianStates.find((s) => s.name === stateName);
      if (match) {
        this.shopForm.patchValue({ stateCode: match.code }, { emitEvent: false });
      }
    });

    try {
      const [state, authData] = await Promise.all([
        this.onboardingService.getState(),
        this.storeService.get('authData'),
      ]);
      this.needsPassword.set(!state.passwordChanged);
      const uid = authData?.uid ?? authData?.UID;
      if (uid != null) {
        this.authData = {
          uid: Number(uid),
          userName: authData.userName,
          email: authData.email ?? null,
        };
      }
    } catch (err) {
      this.loggerService.LogError(err as string, 'OnboardingComponent.ngOnInit()');
    }

    // If a shop profile already exists (e.g. a seeded dev DB, or onboarding was
    // interrupted after this step), preload it so the fields aren't blank and
    // finishing doesn't overwrite the saved row with empty values.
    try {
      const rows: any = await this.shopSettingsService.get();
      const row = Array.isArray(rows) ? rows[0] : rows;
      if (row && row.shopName) {
        this.shopForm.patchValue({
          shopName: row.shopName,
          addressLine1: row.addressLine1,
          addressLine2: row.addressLine2 ?? '',
          city: row.city,
          state: row.state,
          stateCode: row.stateCode,
          pincode: row.pincode,
          phone: row.phone,
          email: row.email ?? '',
          gstin: row.gstin,
          pan: row.pan ?? '',
        }, { emitEvent: false });
      }
    } catch (err) {
      this.loggerService.LogError(err as string, 'OnboardingComponent.preloadShop()');
    }
  }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  isCompleted(index: number): boolean {
    return this.activeStep() > index;
  }

  back(): void {
    this.errorMessage.set('');
    if (this.activeStep() > 0) { this.activeStep.set(this.activeStep() - 1); }
  }

  /** Advances the wizard, running any side effect the current step requires. */
  async next(): Promise<void> {
    if (this.submitting()) { return; }
    this.errorMessage.set('');

    switch (this.currentKey()) {
      case 'welcome':
        this.goForward();
        return;

      case 'password':
        if (!(await this.savePassword())) { return; }
        this.goForward();
        return;

      case 'shop':
        if (!(await this.saveShop())) { return; }
        this.goForward();
        return;

      case 'finish':
        await this.finish();
        return;
    }
  }

  private goForward(): void {
    if (this.activeStep() < this.steps().length - 1) {
      this.activeStep.set(this.activeStep() + 1);
    }
  }

  // ---------------------------------------------------------------------------
  // Step side effects
  // ---------------------------------------------------------------------------
  private async savePassword(): Promise<boolean> {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return false;
    }
    if (!this.authData) {
      this.errorMessage.set('Could not identify the current user. Please sign in again.');
      return false;
    }
    this.submitting.set(true);
    try {
      const hash = await this.authService.hashPassword(this.passwordForm.getRawValue().newPassword);
      await this.onboardingService.changePassword(
        this.authData.uid,
        this.authData.userName,
        this.authData.email,
        hash,
      );
      // NOTE: do NOT flip needsPassword here — `steps` is computed from it, and
      // removing the password step mid-flow would shift activeStep onto the
      // wrong step (skipping the shop step straight to "All set"). The step
      // list must stay stable for the session; passwordChanged is already
      // persisted to the DB by changePassword().
      this.toast.success('Password updated', undefined, { timer: 1400 });
      return true;
    } catch (err) {
      this.loggerService.LogError(err as string, 'OnboardingComponent.savePassword()');
      this.errorMessage.set('Could not update the password. Please try again.');
      return false;
    } finally {
      this.submitting.set(false);
    }
  }

  private async saveShop(): Promise<boolean> {
    if (this.shopForm.invalid) {
      this.shopForm.markAllAsTouched();
      this.errorMessage.set('Please fill in the highlighted fields.');
      return false;
    }
    const raw = this.shopForm.getRawValue();
    const payload: ShopSettings = {
      shopName: raw.shopName!,
      gstin: raw.gstin?.toUpperCase() ?? '',
      pan: raw.pan ? raw.pan.toUpperCase() : null,
      addressLine1: raw.addressLine1!,
      addressLine2: raw.addressLine2 || null,
      city: raw.city!,
      state: raw.state!,
      stateCode: raw.stateCode!,
      pincode: raw.pincode!,
      phone: raw.phone!,
      email: raw.email || null,
      logoPath: null,
      invoicePrefix: 'INV/',
      invoiceStartFrom: 1,
      currentInvoiceCounter: 1,
      defaultCurrency: 'INR',
      timezone: 'Asia/Kolkata',
      roundOffEnabled: 1,
      defaultPrintVariant: 'a4',
      typographyPreset: 'editorial',
    };
    this.submitting.set(true);
    try {
      await this.shopSettingsService.save(payload, this.authData?.uid ?? null);
      return true;
    } catch (err) {
      this.loggerService.LogError(err as string, 'OnboardingComponent.saveShop()');
      this.errorMessage.set('Could not save the shop profile. Please try again.');
      return false;
    } finally {
      this.submitting.set(false);
    }
  }

  private async finish(): Promise<void> {
    this.submitting.set(true);
    try {
      await this.onboardingService.complete();
      this.router.navigate(['/dashboard']);
    } catch (err) {
      this.loggerService.LogError(err as string, 'OnboardingComponent.finish()');
      // Even if persisting the flag fails, don't strand the user.
      this.router.navigate(['/dashboard']);
    } finally {
      this.submitting.set(false);
    }
  }

  toggleTheme(): void {
    this.themeService.toggle();
  }

  // ---------------------------------------------------------------------------
  // Template helpers
  // ---------------------------------------------------------------------------
  shopInvalid(name: string): boolean {
    const c = this.shopForm.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }

  passwordInvalid(name: string): boolean {
    const c = this.passwordForm.get(name);
    return !!c && c.invalid && (c.touched || c.dirty);
  }
}
