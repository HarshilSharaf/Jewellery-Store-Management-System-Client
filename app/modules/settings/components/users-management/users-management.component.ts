import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucidePlus, lucidePencil, lucideTrash2, lucideX, lucideLoader } from '@ng-icons/lucide';

import { UsersService, AppUser } from '../../../../shared/services/Users/users.service';
import { PermissionsService } from '../../../../shared/services/Auth/permissions.service';
import { UserPermissionsMap, UserRole } from '../../../../interfaces/Auth/user-permissions';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';
import { AppDialogService } from '../../../../shared/services/AppDialog/app-dialog.service';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';

interface PermFlag { key: keyof UserPermissionsMap; label: string; }

const PERM_FLAGS: PermFlag[] = [
  { key: 'costsVisible',           label: 'See cost prices' },
  { key: 'canCancelInvoice',       label: 'Cancel invoices' },
  { key: 'canBackup',              label: 'Create / restore backups' },
  { key: 'canDeleteCustomer',      label: 'Delete customers' },
  { key: 'canDeleteProduct',       label: 'Delete products' },
  { key: 'canEditShopSettings',    label: 'Edit shop settings' },
  { key: 'canManageUsers',         label: 'Manage users' },
  { key: 'canForfeitSavingScheme', label: 'Forfeit saving schemes' },
];

const ROLES: UserRole[] = ['admin', 'manager', 'employee'];

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIcon],
  viewProviders: [provideIcons({ lucidePlus, lucidePencil, lucideTrash2, lucideX, lucideLoader })],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersManagementComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly permissions = inject(PermissionsService);
  private readonly storeService = inject(StoreService);
  private readonly logger = inject(LoggerService);
  private readonly dialog = inject(AppDialogService);
  private readonly toast = inject(AppToastService);
  private readonly fb = inject(FormBuilder);

  readonly permFlags = PERM_FLAGS;
  readonly roles = ROLES;

  readonly users = signal<AppUser[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  private actorUid: number | null = null;
  private selfUid: number | null = null;

  // Add
  readonly addOpen = signal(false);
  readonly addPerm = signal<UserPermissionsMap>(this.permissions.defaultsForRole('employee'));
  readonly addForm = this.fb.nonNullable.group({
    userName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]],
    type: ['employee' as UserRole, [Validators.required]],
  });

  // Edit
  readonly editUid = signal<number | null>(null);
  readonly editPerm = signal<UserPermissionsMap>(this.permissions.defaultsForRole('employee'));
  readonly editForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    type: ['employee' as UserRole, [Validators.required]],
    password: [''], // blank = keep existing
  });
  private editUserName = '';

  async ngOnInit(): Promise<void> {
    const auth: any = await this.storeService.get('authData');
    this.actorUid = auth?.uid ?? null;
    this.selfUid = auth?.uid ?? null;
    await this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.users.set(await this.usersService.getAll());
    } catch (err) {
      this.logger.LogError(err as string, 'UsersManagement.load');
      this.toast.error('Could not load users', 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  // ---- helpers -------------------------------------------------------------
  isSelf(u: AppUser): boolean { return this.selfUid != null && u.uid === this.selfUid; }
  permsLabel(u: AppUser): string { return u.permissions ? 'Custom' : 'Role default'; }

  private normaliseForSave(map: UserPermissionsMap, role: UserRole): UserPermissionsMap | null {
    // Store null when the map matches the role defaults, so the user tracks the
    // role; otherwise persist the explicit override.
    const def = this.permissions.defaultsForRole(role);
    const same = PERM_FLAGS.every((f) => map[f.key] === def[f.key]);
    return same ? null : { ...map };
  }

  // ---- add -----------------------------------------------------------------
  openAdd(): void {
    this.editUid.set(null);
    this.addForm.reset({ userName: '', email: '', password: '', type: 'employee' });
    this.addPerm.set(this.permissions.defaultsForRole('employee'));
    this.addOpen.set(true);
  }
  closeAdd(): void { this.addOpen.set(false); }

  onAddRoleChange(role: UserRole): void {
    this.addForm.patchValue({ type: role });
    this.addPerm.set(this.permissions.defaultsForRole(role));
  }
  toggleAddPerm(key: keyof UserPermissionsMap): void {
    this.addPerm.update((m) => ({ ...m, [key]: !m[key] }));
  }

  async submitAdd(): Promise<void> {
    if (this.saving()) { return; }
    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      this.toast.error('Enter a username, valid email, and a password of at least 4 characters.', 'Check the form');
      return;
    }
    const v = this.addForm.getRawValue();
    this.saving.set(true);
    try {
      await this.usersService.add(
        {
          userName: v.userName.trim(),
          email: v.email.trim(),
          password: v.password,
          type: v.type,
          permissions: this.normaliseForSave(this.addPerm(), v.type),
        },
        this.actorUid,
      );
      this.toast.success('User added', undefined, { timer: 1400 });
      this.addOpen.set(false);
      await this.load();
    } catch (err) {
      this.logger.LogError(err as string, 'UsersManagement.submitAdd');
      this.toast.error(this.friendly(err), 'Could not add user');
    } finally {
      this.saving.set(false);
    }
  }

  // ---- edit ----------------------------------------------------------------
  startEdit(u: AppUser): void {
    this.addOpen.set(false);
    this.editUid.set(u.uid);
    this.editUserName = u.userName;
    const role = (u.type ?? 'employee') as UserRole;
    this.editForm.reset({ email: u.email ?? '', type: role, password: '' });
    let map = this.permissions.defaultsForRole(role);
    if (u.permissions) {
      try { map = { ...map, ...JSON.parse(u.permissions) }; } catch { /* keep defaults */ }
    }
    this.editPerm.set(map);
  }
  cancelEdit(): void { this.editUid.set(null); }

  onEditRoleChange(role: UserRole): void {
    this.editForm.patchValue({ type: role });
    this.editPerm.set(this.permissions.defaultsForRole(role));
  }
  toggleEditPerm(key: keyof UserPermissionsMap): void {
    this.editPerm.update((m) => ({ ...m, [key]: !m[key] }));
  }

  async submitEdit(): Promise<void> {
    const uid = this.editUid();
    if (uid == null || this.saving()) { return; }
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.toast.error('Enter a valid email.', 'Check the form');
      return;
    }
    const v = this.editForm.getRawValue();
    this.saving.set(true);
    try {
      await this.usersService.update(
        uid,
        {
          userName: this.editUserName,
          email: v.email.trim(),
          type: v.type,
          permissions: this.normaliseForSave(this.editPerm(), v.type),
        },
        this.actorUid,
      );
      if (v.password && v.password.length) {
        await this.usersService.resetPassword(uid, this.editUserName, v.email.trim(), v.password);
      }
      // If the edited user is the signed-in admin, refresh cached permissions.
      if (this.isSelfUid(uid)) { await this.permissions.getUserPermissions(true); }
      this.toast.success('User updated', undefined, { timer: 1400 });
      this.editUid.set(null);
      await this.load();
    } catch (err) {
      this.logger.LogError(err as string, 'UsersManagement.submitEdit');
      this.toast.error(this.friendly(err), 'Could not update user');
    } finally {
      this.saving.set(false);
    }
  }

  // ---- delete --------------------------------------------------------------
  async deleteUser(u: AppUser): Promise<void> {
    if (this.isSelf(u)) { return; }
    const result = await this.dialog.fire({
      icon: 'warning',
      title: `Delete ${u.userName}?`,
      html: 'This removes the login and its permissions. This cannot be undone.',
      variant: 'danger',
      showCancelButton: true,
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) { return; }
    this.saving.set(true);
    try {
      await this.usersService.remove(u.uid, this.actorUid);
      this.toast.success('User deleted', undefined, { timer: 1400 });
      await this.load();
    } catch (err) {
      this.logger.LogError(err as string, 'UsersManagement.deleteUser');
      this.toast.error(this.friendly(err), 'Could not delete user');
    } finally {
      this.saving.set(false);
    }
  }

  private isSelfUid(uid: number): boolean { return this.selfUid != null && uid === this.selfUid; }

  private friendly(err: unknown): string {
    const msg = (err as any)?.message ?? String(err);
    if (/UNIQUE|constraint/i.test(msg)) { return 'That username or email is already in use.'; }
    if (/Forbidden/i.test(msg)) { return 'You do not have permission to manage users.'; }
    return 'Please try again.';
  }
}
