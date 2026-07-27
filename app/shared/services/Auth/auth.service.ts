import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from 'Backend/Auth/auth';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';
import { PermissionsService } from './permissions.service';

/**
 * AuthService no longer imports `bcryptjs` directly. Under Electron's
 * contextIsolation: true, native module loading in the renderer is
 * disallowed. Password comparison + hashing now runs in the main process
 * behind the auth:compareHash / auth:generateHash IPC channels
 * (see src-electron/preload.js). The hashing algorithm and cost factor
 * are unchanged (bcryptjs, 10 rounds) so existing password hashes in the
 * database continue to validate.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public isLoggedIn = signal<boolean>(false);

  private electronAPI: any = (window as any).electronAPI;
  private readonly permissionsService = inject(PermissionsService);

  constructor(
    private router: Router,
    private DBAuth: Auth,
    private storeService: StoreService,
    private loggerService: LoggerService
  ) {}

  public async login(username: string, password: string) {
    const userData = await this.DBAuth.loginUser(username);
    return new Promise(async (resolve, reject) => {
      if (userData.length !== 0 && userData) {
        const matches: boolean = await this.electronAPI.auth.compareHash(
          password,
          userData[0].password
        );
        if (!matches) {
          reject('Password is Incorrect');
        } else {
          const authData = {
            // The SQLite `loginUser` proc returns the PK as lowercase `uid`
            // (column case is preserved, unlike the old case-insensitive
            // mysql2 path where `.UID` happened to resolve). Prefer `uid`,
            // keep `.UID` as a defensive fallback. Without this, authData.uid
            // was silently undefined -> broke audit actor attribution and the
            // uid-based permission lookup (which quietly fell back to role
            // defaults), and blocked the onboarding password change.
            uid: userData[0].uid ?? userData[0].UID,
            userName: userData[0].userName,
            email: userData[0].email,
            type: userData[0].type,
            lastLogin: userData[0].last_login_date,
            expiration: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).toISOString()
          };
          await this.storeService.set('authData', authData);
          this.isLoggedIn.set(true);
          this.permissionsService.invalidate();

          resolve({
            status: 200,
            ...authData
          });
        }
      } else {
        reject('Username Not Found');
      }
    });
  }

  public async checkLogin(): Promise<boolean> {
    return new Promise<boolean>(async (resolve, reject) => {
      const authData = await this.storeService.get('authData');

      if (!authData) {
        reject(false);
        return;
      } else {
        const currentDate = new Date().getTime();
        const expirationDate = new Date(authData.expiration).getTime();
        if (authData && (currentDate < expirationDate)) {
          this.isLoggedIn.set(true);
          resolve(true);
        } else {
          await this.storeService.delete('authData');
          this.isLoggedIn.set(false);
          reject(false);
        }
      }
    });
  }

  /**
   * Hash a plaintext password in the Electron main process.
   * Renderer never sees bcryptjs directly. Delegates to the same IPC
   * channel bridge used by login() for hash comparison.
   */
  public async hashPassword(plaintext: string): Promise<string> {
    return await this.electronAPI.auth.generateHash(plaintext);
  }

  public async logout() {
    this.loggerService.LogInfo('logout() Request Started.');
    try {
      await this.storeService.delete('authData');
      this.isLoggedIn.set(false);
      this.permissionsService.invalidate();
      this.loggerService.LogInfo('logout() Request Completed.');
      this.router.navigate(['login']);
    } catch (error) {
      this.loggerService.LogError(error as string, 'logout()');
    }
  }
}
