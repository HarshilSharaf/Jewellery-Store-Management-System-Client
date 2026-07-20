import { Injectable, computed, inject, signal } from '@angular/core';
import {
  UserPermissionsMap,
  UserPermissionsResponse,
  UserRole,
} from '../../../interfaces/Auth/user-permissions';
import { StoreService } from '../../../../../Backend/Shared/store.service';

const DEFAULTS: Record<UserRole, UserPermissionsMap> = {
  admin: {
    costsVisible: true,
    canCancelInvoice: true,
    canBackup: true,
    canDeleteCustomer: true,
    canDeleteProduct: true,
    canEditShopSettings: true,
    canManageUsers: true,
    canForfeitSavingScheme: true,
  },
  manager: {
    costsVisible: true,
    canCancelInvoice: true,
    canBackup: false,
    canDeleteCustomer: true,
    canDeleteProduct: true,
    canEditShopSettings: true,
    canManageUsers: false,
    canForfeitSavingScheme: false,
  },
  employee: {
    costsVisible: false,
    canCancelInvoice: false,
    canBackup: false,
    canDeleteCustomer: false,
    canDeleteProduct: false,
    canEditShopSettings: false,
    canManageUsers: false,
    canForfeitSavingScheme: false,
  },
};

const LOCK: UserPermissionsMap = DEFAULTS.employee;

@Injectable({ providedIn: 'root' })
export class PermissionsService {

  private readonly storeService = inject(StoreService);

  private readonly _permissions = signal<UserPermissionsMap>({ ...LOCK });
  private readonly _role = signal<UserRole>('employee');
  private readonly _loaded = signal<boolean>(false);
  private inFlight: Promise<UserPermissionsMap> | null = null;

  readonly permissions = this._permissions.asReadonly();
  readonly role = this._role.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly canCancelInvoice = computed(() => this._permissions().canCancelInvoice);
  readonly canBackup = computed(() => this._permissions().canBackup);
  readonly canDeleteCustomer = computed(() => this._permissions().canDeleteCustomer);
  readonly canDeleteProduct = computed(() => this._permissions().canDeleteProduct);
  readonly canEditShopSettings = computed(() => this._permissions().canEditShopSettings);
  readonly canManageUsers = computed(() => this._permissions().canManageUsers);
  readonly canForfeitSavingScheme = computed(() => this._permissions().canForfeitSavingScheme);
  readonly costsVisible = computed(() => this._permissions().costsVisible);

  private get api(): any {
    const w = (typeof window !== 'undefined' ? (window as any) : {});
    return w?.electronAPI?.auth;
  }

  async getUserPermissions(force = false): Promise<UserPermissionsMap> {
    if (this._loaded() && !force) { return this._permissions(); }
    if (this.inFlight && !force) { return this.inFlight; }

    this.inFlight = this.loadFromIpc();
    try {
      return await this.inFlight;
    } finally {
      this.inFlight = null;
    }
  }

  invalidate(): void {
    this._permissions.set({ ...LOCK });
    this._role.set('employee');
    this._loaded.set(false);
    this.inFlight = null;
  }

  defaultsForRole(role: UserRole): UserPermissionsMap {
    return { ...DEFAULTS[role] };
  }

  private async loadFromIpc(): Promise<UserPermissionsMap> {
    let uid: number | null = null;
    let role: UserRole = 'employee';
    try {
      const authData: any = await this.storeService.get('authData');
      if (authData) {
        uid = Number(authData.uid);
        if (authData.type === 'admin' || authData.type === 'manager' || authData.type === 'employee') {
          role = authData.type;
        }
      }
    } catch { /* fall through */ }

    if (!uid || !this.api?.getUserPermissions) {
      const fallback = this.defaultsForRole(role);
      this._permissions.set(fallback);
      this._role.set(role);
      this._loaded.set(true);
      return fallback;
    }

    try {
      const raw = await this.api.getUserPermissions(uid);
      const row = this.pickRow(raw);
      if (!row) {
        const fallback = this.defaultsForRole(role);
        this._permissions.set(fallback);
        this._role.set(role);
        this._loaded.set(true);
        return fallback;
      }
      const resolvedRole = this.pickRole(row.type ?? row.userType, role);
      const map = this.parseMap(
        (row as UserPermissionsResponse).permissions ?? row['permissions'],
        resolvedRole,
      );
      this._permissions.set(map);
      this._role.set(resolvedRole);
      this._loaded.set(true);
      return map;
    } catch {
      const fallback = this.defaultsForRole(role);
      this._permissions.set(fallback);
      this._role.set(role);
      this._loaded.set(true);
      return fallback;
    }
  }

  private pickRow(raw: any): any {
    if (!raw) { return null; }
    if (Array.isArray(raw)) {
      const first = raw[0];
      if (Array.isArray(first)) { return first[0] ?? null; }
      return first ?? null;
    }
    return raw;
  }

  private pickRole(candidate: any, fallback: UserRole): UserRole {
    if (candidate === 'admin' || candidate === 'manager' || candidate === 'employee') {
      return candidate;
    }
    return fallback;
  }

  private parseMap(raw: any, role: UserRole): UserPermissionsMap {
    const base = DEFAULTS[role] ?? DEFAULTS.employee;
    let parsed: any = raw;
    if (typeof raw === 'string') {
      try { parsed = JSON.parse(raw); } catch { parsed = null; }
    }
    if (!parsed || typeof parsed !== 'object') {
      return { ...base };
    }
    return {
      costsVisible: this.pick(parsed.costsVisible, base.costsVisible),
      canCancelInvoice: this.pick(parsed.canCancelInvoice, base.canCancelInvoice),
      canBackup: this.pick(parsed.canBackup, base.canBackup),
      canDeleteCustomer: this.pick(parsed.canDeleteCustomer, base.canDeleteCustomer),
      canDeleteProduct: this.pick(parsed.canDeleteProduct, base.canDeleteProduct),
      canEditShopSettings: this.pick(parsed.canEditShopSettings, base.canEditShopSettings),
      canManageUsers: this.pick(parsed.canManageUsers, base.canManageUsers),
      canForfeitSavingScheme: this.pick(parsed.canForfeitSavingScheme, base.canForfeitSavingScheme),
    };
  }

  private pick(candidate: any, fallback: boolean): boolean {
    if (candidate === true || candidate === 1 || candidate === '1') { return true; }
    if (candidate === false || candidate === 0 || candidate === '0') { return false; }
    return fallback;
  }
}
