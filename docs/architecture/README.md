# Architecture

This section documents technical decisions and system boundaries for Kynovia Access.

## Principles

- Keep each app focused on a user surface.
- Keep shared domain contracts in packages, not duplicated across apps.
- Treat tenant isolation as a first-class architectural constraint.
- Keep Supabase migrations as the database source of truth.
- Prefer explicit APIs between packages over implicit cross-app coupling.

## Current Shape

```txt
apps/
  web-admin
  web-portaria
  mobile-pwa
packages/
  ui
  database
  auth
  access-engine
  integrations
supabase/
  migrations
  functions
```

## Deployment Direction

- Vercel will host the Next.js apps as separate deploy targets.
- Supabase will own database, auth, realtime, storage, and Edge Functions.
- GitHub Actions validates pull requests with lint, typecheck, test, and build jobs.

## Decision Records

Architecture Decision Records should be added here as the platform choices become concrete.
