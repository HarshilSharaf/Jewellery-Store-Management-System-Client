import { Routes } from '@angular/router';
import { AuthGuard } from './guards/AuthGuard/auth.guard';
import { onboardingGuard } from './shared/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: "",
    loadChildren: () => import('./modules/main/main-routing.config').then(m => m.mainRoutes),
    canActivate: [AuthGuard, onboardingGuard]
  },
  {
    // First-run setup wizard. Behind AuthGuard (user must be signed in) but NOT
    // onboardingGuard, otherwise the guard's redirect to '/onboarding' would loop.
    path: 'onboarding',
    loadComponent: () =>
      import('./modules/onboarding/components/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login-routing.config').then(m => m.loginRoutes),
  }
];
