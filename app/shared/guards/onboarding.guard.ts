import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { OnboardingService } from '../../../../Backend/Shared/onboarding.service';

/**
 * Redirects first-time users into the setup wizard before they can reach the
 * authenticated app shell. Applied to the main route tree (see
 * app-routing.config.ts); the `/onboarding` route itself is intentionally NOT
 * guarded by this, to avoid a redirect loop.
 *
 * The check is cheap once onboarding is done (a single electron-store read via
 * OnboardingService.needsOnboarding()'s fast path).
 */
export const onboardingGuard: CanActivateFn = async () => {
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  const needs = await onboardingService.needsOnboarding();
  if (!needs) { return true; }

  return router.parseUrl('/onboarding');
};
