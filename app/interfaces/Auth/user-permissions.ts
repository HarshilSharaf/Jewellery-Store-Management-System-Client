export type UserRole = 'admin' | 'manager' | 'employee';

export interface UserPermissionsMap {
  costsVisible: boolean;
  canCancelInvoice: boolean;
  canBackup: boolean;
  canDeleteCustomer: boolean;
  canDeleteProduct: boolean;
  canEditShopSettings: boolean;
  canManageUsers: boolean;
  canForfeitSavingScheme: boolean;
}

export interface UserPermissionsResponse {
  userId: number;
  type: UserRole;
  permissions: UserPermissionsMap;
  defaultPermissions: UserPermissionsMap;
}
