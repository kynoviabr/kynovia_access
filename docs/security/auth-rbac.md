# Auth, Profiles, and RBAC

Kynovia Access uses Supabase Auth for authentication and the `profiles` table for application authorization.

## Authentication

The Next.js apps use Supabase SSR clients so authenticated sessions are stored in HTTP cookies and can be read by middleware, server actions, and server components.

Implemented baseline routes:

- `/login`
- `/reset-password`
- `/access-denied`
- `/dashboard` for Admin and Portaria
- `/home` for the Mobile PWA

## Profile Source of Truth

Authentication identifies the user. Authorization is based on `public.profiles`.

Required profile fields:

- `id`: matches `auth.users.id`
- `tenant_id`
- `full_name`
- `role`

The profile must exist and the role must be recognized before the app grants access to protected areas.

## Roles

Initial roles:

- `platform_admin`
- `tenant_admin`
- `condominium_admin`
- `gatehouse_operator`
- `resident`

## App Access Matrix

| Role | Admin | Portaria | Mobile PWA |
| --- | --- | --- | --- |
| `platform_admin` | Yes | Yes | Yes |
| `tenant_admin` | Yes | Yes | Yes |
| `condominium_admin` | Yes | Yes | Yes |
| `gatehouse_operator` | No | Yes | No |
| `resident` | No | No | Yes |

## Route Protection

Middleware checks Supabase sessions before protected routes:

- Admin: `/dashboard`
- Portaria: `/dashboard`
- Mobile PWA: `/home`

Server components then load the profile and validate app-level RBAC. Unauthorized users are redirected to `/access-denied`.

## RLS Validation

RLS policies remain the database enforcement boundary. App RBAC is a user-experience and routing layer; it does not replace database policies.

Phase 03 validates that:

- Browser apps do not use service role keys.
- The authenticated user must have a valid profile.
- Profile roles control app access.
- Protected routes redirect anonymous sessions to login.
- Unauthorized profile roles redirect to access denied.
