/** Swagger documentation for Phase 0 admin/staff authentication. */

export const AUTH_SYSTEM_OVERVIEW = `# Authentication system

Phase 0 exposes **admin dashboard authentication only**. Client registration, OTP, email verification, avatars, and password reset routes are not registered.

### Login (\`POST /admin/dashboard/auth/login\`)

Root and staff users sign in with **email + password** only.
- Passwords are compared with \`passwordHash\`.
- Users must have \`status: ACTIVE\` and \`deletedAt: null\`.
- Root users (\`isRoot: true\`) can always sign in.
- Non-root users must have at least one active role assignment.
- The response includes \`roles[]\` and \`permissionCodes[]\`.

## JWT

- Strategy: Passport JWT bearer token
- Payload: \`sub\`, \`email\`, \`iat\`, \`exp\`
- Guard: \`JwtAuthGuard\` (skip with \`@Public()\`)

## Admin RBAC

Root users bypass permission checks. Staff permissions come from \`UserRole -> Role -> RolePermission -> Permission\`.
`;
