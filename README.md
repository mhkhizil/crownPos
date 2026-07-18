# NestJS Onion Architecture Template

Reusable NestJS backend base for future projects (POS, marketplaces, etc.).

## Architecture

```
src/
  domain/          # Entities, enums, repository & service ports (no Nest/Prisma)
  application/     # Use cases + DTOs
  infrastructure/  # Prisma, email/SMS/storage adapters, repositories
  presentation/    # Controllers, Nest modules, JWT strategy
  common/          # Guards, filters, decorators, throttling helpers
```

Dependencies point **inward**: presentation → application → domain ← infrastructure.

See `docs/architecture.md` and `docs/routing.md`.

## Included features

- **Auth**: register, login (client phone/email + admin email), phone OTP, email verification, forgot/reset password, JWT
- **Admin RBAC**: roles, permissions, staff admin users, root admin seed/integrity
- **Infra ports**: email (Brevo SMTP), SMS (SMSPoh), file storage (Supabase)
- **Cross-cutting**: validation pipe, HTTP exception filter, Swagger, auth rate limiting

## Setup

```bash
cp .env.example .env
# fill DATABASE_URL, JWT_SECRET, email/SMS keys, root admin

npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

Swagger: `http://localhost:3000/api/docs`

## Adding a feature module

1. Domain entity + repository interface
2. Application use case(s) + DTOs
3. Infrastructure repository implementing the port
4. Presentation Nest module + controller
5. Register the module in `app.module.ts`
6. Extend `AdminPermission` if the feature needs RBAC

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run start:dev` | Watch mode |
| `npm run build` | Generate Prisma client + Nest build |
| `npm run db:migrate:dev` | Create/apply migrations |
| `npm run db:seed` | Wipe public data + seed root admin + test client |
| `npm test` | Unit tests |
