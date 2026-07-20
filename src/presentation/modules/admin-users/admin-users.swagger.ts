/** Long-form Swagger copy for staff user management APIs. */

export const ADMIN_USER_MANAGEMENT_WORKFLOW = `## Staff user management — RBAC overview

This system uses **Role-Based Access Control (RBAC)** to delegate staff responsibilities without sharing the root account.

### Account types

| Type | Description | Login method |
|------|-------------|-------------|
| **Root user** | Seeded once with \`isRoot=true\`; bypasses permission checks. | Email + password via \`POST /admin/dashboard/auth/login\` |
| **Staff user** | Created by root and assigned one or more roles. | Email + password via \`POST /admin/dashboard/auth/login\` |

### Authentication
- **All endpoints on this page require JWT** (\`Authorization: Bearer <accessToken>\`).
- **Only root users** can create or modify staff users. Non-root staff receive **403 Forbidden**.
- Staff users have restricted access depending on their assigned permission codes.

### Workflow
1. Seeded root user logs in via admin dashboard login.
2. Root creates roles via \`POST /admin/dashboard/admin-roles\`.
3. Root creates staff accounts via \`POST /admin/dashboard/admin-users\`.
4. Root assigns or removes role links.
5. Staff users log in and can only access features matching their permissions.

### Staff creation rules
- **email** is unique across all users — **409** on conflict.
- **phone** is optional.
- Password is hashed into \`passwordHash\`.
- No OTP or email verification flow is registered.`;

export const ADMIN_USER_LIST_DOC = `${ADMIN_USER_MANAGEMENT_WORKFLOW}

### This endpoint: \`GET /admin/dashboard/admin-users\`
Returns root and staff users. Each row includes:
- \`id\`, \`email\`, \`nameEn\`, \`nameMm\`, \`phone\`
- \`isRoot\`, \`status\`
- \`roles[]\`
- \`permissionCodes[]\`
- \`createdAt\`, \`updatedAt\`

Use this to populate the staff management table in the dashboard.`;

export const ADMIN_USER_CREATE_DOC = `${ADMIN_USER_MANAGEMENT_WORKFLOW}

### This endpoint: \`POST /admin/dashboard/admin-users\`
Creates a new staff user account in one step.

**Required fields:**
- \`nameEn\` — English display name
- \`email\` — unique email address
- \`password\` — min 8 characters, will be hashed with bcrypt (12 rounds)

**Optional fields:**
- \`nameMm\`
- \`phone\`
- \`roleIds[]\`

**What happens server-side:**
1. Validates that the requesting user is root (otherwise **403**).
2. Checks uniqueness of \`email\` (otherwise **409**).
3. Hashes password and creates the user.
4. Assigns any supplied role IDs.
5. Returns the new staff user's details \`AdminUserListDto\` (wrapped in \`ApiResponseDto\`).`;

export const ADMIN_USER_UPDATE_ROLE_DOC = `${ADMIN_USER_MANAGEMENT_WORKFLOW}

### This endpoint: \`PATCH /admin/dashboard/admin-users/:userId/roles\`
Assigns one or more roles to an existing staff user.

**Rules:**
- Cannot change your own role (**400**).
- The target user must exist (**404**).
- Each role must exist (**404**).`;

export const ADMIN_USER_DEMOTE_DOC = `${ADMIN_USER_MANAGEMENT_WORKFLOW}

### This endpoint: \`DELETE /admin/dashboard/admin-users/:userId/roles/:roleId\`
Soft-removes one role assignment from a user.

**Rules:**
- Cannot demote yourself (**400**).
- Target user must exist (**404**).
- Role must exist (**404**).

**What happens:**
1. Sets \`deletedAt\` on the matching \`UserRole\` row.
2. The user record is retained.
3. If no roles remain and the user is not root, subsequent admin login attempts fail with **403**.`;
