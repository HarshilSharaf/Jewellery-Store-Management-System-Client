import { Injectable, inject } from '@angular/core';
import { DatabaseService } from '../../../../../Backend/Shared/database.service';
import { UserPermissionsMap, UserRole } from '../../../interfaces/Auth/user-permissions';

export interface AppUser {
  uid: number;
  userName: string;
  email: string;
  type: UserRole;
  /** Raw permissions JSON text (null = follow role defaults). */
  permissions: string | null;
  imagePath?: string | null;
  last_login_date?: string | null;
}

export interface NewUserInput {
  userName: string;
  email: string;
  password: string;
  type: UserRole;
  /** null = follow role defaults; a map = per-user override. */
  permissions: UserPermissionsMap | null;
}

export interface UpdateUserInput {
  userName: string;
  email: string;
  type: UserRole;
  permissions: UserPermissionsMap | null;
}

/**
 * Renderer wrapper over the users.js stored procedures (reached through the
 * generic db:execute bridge — no dedicated IPC channel needed). Passwords are
 * hashed in the main process via the auth:generateHash bridge before they ever
 * reach a proc; the procs store exactly what they are given.
 */
@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly db = inject(DatabaseService);
  private get authApi(): any { return (window as any).electronAPI?.auth; }

  async getAll(): Promise<AppUser[]> {
    const rows = await this.db.query('call get_all_users();');
    return Array.isArray(rows) ? (rows as AppUser[]) : [];
  }

  /** Creates a user; returns the new uid (or null). */
  async add(input: NewUserInput, actorUserId: number | null): Promise<number | null> {
    const passwordHash = await this.authApi.generateHash(input.password);
    const rows = await this.db.execute(
      'call add_user(?, ?, ?, ?, ?, ?);',
      [
        input.userName,
        input.email,
        passwordHash,
        input.type,
        input.permissions ? JSON.stringify(input.permissions) : null,
        actorUserId,
      ],
    );
    const row = Array.isArray(rows) && rows.length ? rows[0] : null;
    return row?.userId ?? null;
  }

  /**
   * Updates name/email/type + permissions. userName/email/type are COALESCEd by
   * the proc (null keeps existing); permissions is assigned directly (null =>
   * clear the override so the role defaults apply).
   */
  async update(userId: number, input: UpdateUserInput, actorUserId: number | null): Promise<void> {
    await this.db.execute(
      'call update_user(?, ?, ?, ?, ?, ?);',
      [
        userId,
        input.userName,
        input.email,
        input.type,
        input.permissions ? JSON.stringify(input.permissions) : null,
        actorUserId,
      ],
    );
  }

  /**
   * Resets a user's password. update_user_details assigns userName/email
   * directly, so the current values must be passed to avoid nulling them.
   */
  async resetPassword(userId: number, userName: string, email: string, newPassword: string): Promise<void> {
    const passwordHash = await this.authApi.generateHash(newPassword);
    await this.db.execute(
      'call update_user_details(?, ?, ?, ?);',
      [userId, userName, passwordHash, email],
    );
  }

  async remove(userId: number, actorUserId: number | null): Promise<void> {
    await this.db.execute('call delete_user(?, ?);', [userId, actorUserId]);
  }
}
