import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { PermissionsService } from '../services/Auth/permissions.service';
import { UserPermissionsMap } from '../../interfaces/Auth/user-permissions';
import { AppToastService } from '../services/AppToast/app-toast.service';

export function permissionGuard(flag: keyof UserPermissionsMap): CanActivateFn {
  return async () => {
    const permissionsService = inject(PermissionsService);
    const router = inject(Router);
    const toast = inject(AppToastService);

    await permissionsService.getUserPermissions();
    const allowed = permissionsService.permissions()[flag];

    if (allowed) { return true; }

    toast.error('You do not have permission to view that section.', 'Access denied', { timer: 2200 });
    return router.parseUrl('/dashboard');
  };
}
