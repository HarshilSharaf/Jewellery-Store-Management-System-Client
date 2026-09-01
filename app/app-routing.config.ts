import { Routes } from '@angular/router';
import { authGuard } from './guards/AuthGuard/auth.guard';
import { onboardingGuard } from './shared/guards/onboarding.guard';

export const routes: Routes = [
  {
    path: "",
    loadChildren: () => import('./modules/main/main-routing.config').then(m => m.mainRoutes),
    canActivate: [authGuard, onboardingGuard]
  },
  {
    // First-run setup wizard. Behind authGuard (user must be signed in) but NOT
    // onboardingGuard, otherwise the guard's redirect to '/onboarding' would loop.
    path: 'onboarding',
    loadComponent: () =>
      import('./modules/onboarding/components/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [authGuard]
  },
  {
    path: 'login',
    loadChildren: () => import('./modules/login/login-routing.config').then(m => m.loginRoutes),
  }
];
