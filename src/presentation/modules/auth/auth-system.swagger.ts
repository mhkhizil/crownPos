/**
 * Swagger documentation for the complete auth system.
 * Covers both client and admin authentication flows.
 */

export const AUTH_SYSTEM_OVERVIEW = `# Authentication system

This template has **two separate authentication paths** — one for **clients** and one for **admin dashboard**. They share the same \`users\` table and JWT strategy but enforce different login rules.

## Client authentication path

### 1. Registration (\`POST /client/auth/register\`)

New users sign up with:
- **phone** (unique, used for SMS OTP)
- **email** (unique, used for email verification token)
- **password** (hashed with bcrypt, 12 rounds)
- **nickname** (display name)

After successful registration:
- OTP is sent via SMS to the phone number.
- Email verification token is generated.
- The user is created with \`adminRoleId: null\` (not an admin).
- **No JWT tokens are issued** at registration — the user must verify and log in.

### 2. Phone verification flow

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | \`POST /client/auth/otp/send\` | Request a 6-digit OTP via SMS |
| 2 | \`POST /client/auth/otp/verify\` | Submit the OTP code for verification |

### 3. Email verification flow

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | \`POST /client/auth/email/send-verification\` | Request a verification token via email |
| 2 | \`POST /client/auth/email/verify\` | Submit the token for verification |

### 4. Login (\`POST /client/auth/login\`)

Clients sign in with **phone + password** or **email + password**:
- Rejects **admin accounts** (\`adminRoleId !== null\`) with **403**.
- Rejects **inactive/banned** accounts.
- On success, returns \`accessToken\` (JWT).

### 5. Password reset

| Step | Endpoint | Description |
|------|----------|-------------|
| 1 | \`POST /client/auth/forgot-password\` | Send reset code to phone or email |
| 2 | \`POST /client/auth/reset-password\` | Set new password with the code |

## Admin dashboard authentication path

### Login (\`POST /admin/dashboard/auth/login\`)

Admins sign in with **email + password** only.
- Rejects non-admin accounts with **403**.
- Returns \`user.adminRole\` with permissions.

## JWT

- Strategy: Passport JWT bearer token
- Payload: \`sub\`, \`phone\`, \`authTokenVersion\`, \`iat\`, \`exp\`
- Guard: \`JwtAuthGuard\` (skip with \`@Public()\`)

## Admin RBAC

Root admin has system role \`ROOT_ADMIN\`. Additional roles and permissions are managed via admin-roles / admin-users modules.
Extend \`AdminPermission\` enum per project.
`;
