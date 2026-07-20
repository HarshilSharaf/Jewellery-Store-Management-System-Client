import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import Swal from 'sweetalert2';

import { PermissionsService } from '../services/Auth/permissions.service';
import { UserPermissionsMap } from '../../interfaces/Auth/user-permissions';

export function permissionGuard(flag: keyof UserPermissionsMap): CanActivateFn {
  return async () => {
    const permissionsService = inject(PermissionsService);
    const router = inject(Router);

    await permissionsService.getUserPermissions();
    const allowed = permissionsService.permissions()[flag];

    if (allowed) { return true; }

    Swal.fire({
      icon: 'error',
      title: 'Access denied',
      text: 'You do not have permission to view that section.',
      timer: 2200,
      showConfirmButton: false,
    });
    return router.parseUrl('/dashboard');
  };
}
