# Security

This section documents security expectations for Kynovia Access.

## Baseline

Kynovia Access handles sensitive operational data for residential access control. Security work should be considered part of product design, not an afterthought.

## Expectations

- Enforce tenant isolation in database policies and service-layer checks.
- Keep service role keys server-only.
- Never expose private Supabase keys to browser apps.
- Use least-privilege integration tokens.
- Preserve access decision, physical command, permission change, and operator action audit trails.
- Treat authentication, authorization, and auditability as separate concerns.

## Responsible Disclosure

Security reporting process is defined in `SECURITY.md`.

## Current Documents

- `docs/security/rls-policy-model.md`
- `docs/security/auth-rbac.md`
- `docs/security/audit-compliance.md`
