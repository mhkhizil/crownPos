/** Seeded permission codes (Permission.code). Root bypasses all checks. */
export enum PermissionCode {
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_MASTER_DATA = 'MANAGE_MASTER_DATA',
  MANAGE_PRODUCTION = 'MANAGE_PRODUCTION',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  MANAGE_SALES = 'MANAGE_SALES',
  MANAGE_OUTBOUND = 'MANAGE_OUTBOUND',
  MANAGE_BILLING = 'MANAGE_BILLING',
  MANAGE_PRICING = 'MANAGE_PRICING',
  MANAGE_BD = 'MANAGE_BD',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
}

/** @deprecated Use PermissionCode */
export const AdminPermission = PermissionCode;
export type AdminPermission = PermissionCode;
