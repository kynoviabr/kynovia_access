# Security

This section documents security expectations for Kynovia Access.

## Baseline

Kynovia Access handles sensitive operational data for residential access control. Security work should be considered part of product design, not an afterthought.

## Expectations

- Enforce tenant isolation in database policies and service-layer checks.
- Keep service role keys server-only.
- Never expose private Supabase keys to browser apps.
- Use least-privilege integration tokens.
- Preserve access decision and operator action audit trails when workflows are implemented.
- Treat authentication, authorization, and auditability as separate concerns.

## Responsible Disclosure

Security reporting process is defined in `SECURITY.md`.

## Future Documents

- RLS policy model
- Auth roles and permissions
- Audit log strategy
- LGPD and data retention notes
- Incident response checklist
