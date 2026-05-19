# RLS Policy Model

The initial Row Level Security model is intentionally conservative and tenant-aware.

## Helper Functions

The foundation migration defines stable helper functions:

- `current_tenant_id()`
- `current_profile_role()`
- `has_tenant_access(target_tenant_id)`
- `has_condominium_access(target_condominium_id)`
- `can_operate_condominium(target_condominium_id)`
- `is_current_resident_for_unit(target_resident_id, target_unit_id, target_condominium_id)`

These helpers use `auth.uid()` and `profiles` to resolve the current authenticated user's tenant and role.

The helper functions are intended for RLS policies, not public RPC usage. Execute privileges are revoked from `public`, `anon`, and `authenticated` roles in the hardening migration.

## Roles

Initial profile roles:

- `platform_admin`
- `tenant_admin`
- `condominium_admin`
- `gatehouse_operator`
- `resident`

Condominium memberships support:

- `condominium_admin`
- `gatehouse_operator`
- `resident`

## Policy Baseline

- Tenant records are visible only to users in the same tenant.
- Condominium-scoped records require condominium access.
- Operational writes require condominium operation rights.
- Access events can be inserted by operators.
- Residents can create and cancel their own digital invites only when their authenticated profile is
  linked to an active resident and to the selected unit.
- Gatehouse invite validation records can be inserted by operators and read by users with
  condominium access.
- Vehicle plate blacklists can be read by users with condominium access and managed only by
  condominium operators.
- Visitor vehicle access stays can be read by users with condominium access and inserted/updated
  only by condominium operators.
- Audit logs are readable by same-tenant users and immutable after insert.

## Service Role Boundary

The Supabase service role key bypasses RLS and must remain server-only.

It must never be exposed through:

- Next.js public environment variables.
- Browser bundles.
- Client-side package exports.
- Logs, issues, or Pull Request descriptions.

## Future Hardening

Later Auth and RBAC stories should refine:

- Resident self-service policies.
- Admin-only mutation boundaries.
- Invite ownership rules.
- Audit log insert ownership.
- Policy tests with authenticated JWT fixtures.
