export class PermissionEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly module: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly description: string | null,
  ) {}
}

export class RoleEntity {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly nameEn: string,
    public readonly nameMm: string | null,
    public readonly description: string | null,
    public readonly isSystem: boolean,
    public readonly permissionIds: string[],
    public readonly permissionCodes: string[],
  ) {}
}
