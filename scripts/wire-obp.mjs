/**
 * Wire outbound, billing, pricing repos + use-cases + controllers
 * node scripts/wire-obp.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  fs.writeFileSync(path.join(root, rel), content.replace(/\r?\n/g, '\n'));
  console.log('✓', rel);
}

function simpleUc({
  folder,
  file,
  className,
  permission,
  repoToken,
  repoFile,
  iRepo,
  dtoImport,
  responseType,
  args,
  body,
}) {
  w(
    `src/application/use-cases/${folder}/${file}.ts`,
    `import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import type { IUserRepository } from '../../../domain/repositories/user.repository.interface.js';
import { ${repoToken} } from '../../../domain/repositories/${repoFile}.js';
import type { ${iRepo} } from '../../../domain/repositories/${repoFile}.js';
${dtoImport}import { requirePermission } from '../_helpers/admin-authorization.helper.js';
import { PermissionCode } from '../../../domain/enums/permission-code.enum.js';

@Injectable()
export class ${className} {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(${repoToken}) private readonly repo: ${iRepo},
  ) {}

  async execute(${args}): Promise<${responseType}> {
    await requirePermission(
      this.users,
      actorId,
      PermissionCode.${permission},
    );
    ${body}
  }
}
`,
  );
}

// OUTBOUND REPO
w(
  'src/infrastructure/repositories/outbound.repository.ts',
  fs
    .readFileSync(path.join(root, 'src/infrastructure/repositories/outbound.repository.ts'), 'utf8')
    .replace(
      `import type {
  CreateOutboundInput,
  IOutboundRepository,
  OutboundStatus,
} from '../../domain/repositories/outbound.repository.interface.js';`,
      `import { FactoryOutboundMapper } from '../mappers/factory-outbound.mapper.js';
import type {
  CreateOutboundInput,
  IOutboundRepository,
  OutboundStatus,
} from '../../domain/repositories/outbound.repository.interface.js';
import type { FactoryOutboundEntity } from '../../domain/entities/factory-outbound.entity.js';`,
    ),
);

console.log('patch outbound manually in next step');
