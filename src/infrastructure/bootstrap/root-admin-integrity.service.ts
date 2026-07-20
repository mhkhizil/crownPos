import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hash } from 'bcrypt';
import { PrismaService } from '../database/prisma.service.js';
import { PermissionCode } from '../../domain/enums/permission-code.enum.js';

const PERMISSION_DEFS: Array<{
  code: PermissionCode;
  module: string;
  nameEn: string;
}> = [
  { code: PermissionCode.MANAGE_USERS, module: 'users', nameEn: 'Manage users' },
  { code: PermissionCode.MANAGE_ROLES, module: 'roles', nameEn: 'Manage roles' },
  {
    code: PermissionCode.MANAGE_MASTER_DATA,
    module: 'master',
    nameEn: 'Manage master data',
  },
  {
    code: PermissionCode.MANAGE_PRODUCTION,
    module: 'production',
    nameEn: 'Manage production',
  },
  {
    code: PermissionCode.MANAGE_INVENTORY,
    module: 'inventory',
    nameEn: 'Manage inventory',
  },
  { code: PermissionCode.MANAGE_SALES, module: 'sales', nameEn: 'Manage sales' },
  {
    code: PermissionCode.MANAGE_OUTBOUND,
    module: 'outbound',
    nameEn: 'Manage outbound',
  },
  {
    code: PermissionCode.MANAGE_BILLING,
    module: 'billing',
    nameEn: 'Manage billing',
  },
  {
    code: PermissionCode.MANAGE_PRICING,
    module: 'pricing',
    nameEn: 'Manage pricing',
  },
  { code: PermissionCode.MANAGE_BD, module: 'bd', nameEn: 'Manage business development' },
  {
    code: PermissionCode.VIEW_ANALYTICS,
    module: 'analytics',
    nameEn: 'View analytics',
  },
];

@Injectable()
export class RootAdminIntegrityService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RootAdminIntegrityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    for (const p of PERMISSION_DEFS) {
      const existing = await this.prisma.permission.findFirst({
        where: { code: p.code },
      });
      if (existing) {
        await this.prisma.permission.update({
          where: { id: existing.id },
          data: {
            module: p.module,
            nameEn: p.nameEn,
            deletedAt: null,
          },
        });
      } else {
        await this.prisma.permission.create({
          data: {
            code: p.code,
            module: p.module,
            nameEn: p.nameEn,
          },
        });
      }
    }

    const rootEmail = (
      this.configService.get<string>('ROOT_ADMIN_EMAIL') ??
      'mhkhizilthurainzaw@gmail.com'
    )
      .trim()
      .toLowerCase();
    const rootPassword =
      this.configService.get<string>('ROOT_ADMIN_PASSWORD') ?? 'root123';
    const rootName =
      this.configService.get<string>('ROOT_ADMIN_NAME') ??
      this.configService.get<string>('ROOT_ADMIN_NICKNAME') ??
      'Root Admin';

    let root = await this.prisma.user.findFirst({
      where: { OR: [{ email: rootEmail }, { isRoot: true }], deletedAt: null },
    });

    if (!root) {
      const passwordHash = await hash(rootPassword, 10);
      root = await this.prisma.user.create({
        data: {
          email: rootEmail,
          passwordHash,
          nameEn: rootName,
          isRoot: true,
          status: 'ACTIVE',
        },
      });
      this.logger.log(`Created root user ${root.id} (${rootEmail})`);
    } else {
      await this.prisma.user.update({
        where: { id: root.id },
        data: {
          email: rootEmail,
          nameEn: rootName,
          isRoot: true,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });
      this.logger.log(`ROOT integrity ensured for user ${root.id}`);
    }
  }
}
