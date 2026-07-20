/**
 * Generates remaining feature modules from the old business monolith pattern.
 * Run: node scripts/split-features.mjs
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
function w(rel, content) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  console.log('✓', rel);
}

function featureModule({
  folder,
  classPrefix,
  routeSuffix,
  repoToken,
  repoClass,
  useCases,
  controllerMethods,
}) {
  // DTOs index
  w(
    `src/application/dtos/${folder}/index.ts`,
    useCases.map((u) => `export * from './${u.dtoFile}.js';`).join('\n') + '\n',
  );

  for (const u of useCases) {
    if (u.dtoContent) {
      w(`src/application/dtos/${folder}/${u.dtoFile}.ts`, u.dtoContent);
    }
    w(
      `src/application/use-cases/${folder}/${u.file}.ts`,
      u.useCaseContent,
    );
  }

  w(
    `src/application/use-cases/${folder}/index.ts`,
    useCases.map((u) => `export * from './${u.file}.js';`).join('\n') + '\n',
  );

  w(
    `src/presentation/modules/${folder}/${folder}.controller.ts`,
    controllerMethods,
  );

  w(
    `src/presentation/modules/${folder}/${folder}.module.ts`,
    `import { Module } from '@nestjs/common';
import { ${classPrefix}Controller } from './${folder}.controller.js';
${useCases.map((u) => `import { ${u.className} } from '../../../application/use-cases/${folder}/${u.file}.js';`).join('\n')}
import { ${repoToken} } from '../../../domain/repositories/${folder}.repository.interface.js';
import { ${repoClass} } from '../../../infrastructure/repositories/${folder}.repository.js';
import { USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface.js';
import { UserRepository } from '../../../infrastructure/repositories/user.repository.js';
${folder === 'production' ? `import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';\nimport { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';` : ''}
${folder === 'outbound' || folder === 'sales' ? `import { INVENTORY_REPOSITORY } from '../../../domain/repositories/inventory.repository.interface.js';\nimport { InventoryRepository } from '../../../infrastructure/repositories/inventory.repository.js';` : ''}

@Module({
  controllers: [${classPrefix}Controller],
  providers: [
${useCases.map((u) => `    ${u.className},`).join('\n')}
    { provide: ${repoToken}, useClass: ${repoClass} },
    { provide: USER_REPOSITORY, useClass: UserRepository },
${folder === 'production' || folder === 'outbound' || folder === 'sales' ? `    { provide: INVENTORY_REPOSITORY, useClass: InventoryRepository },` : ''}
  ],
})
export class ${classPrefix}Module {}
`,
  );
}

// We'll write critical files manually below in this script for sales/outbound/billing/pricing/bd/inventory/master-data/production

console.log('Preparing feature split files...');
