# Kynovia Access

Kynovia Access is a SaaS platform for multi-condominium access control operations. The project is organized as a TypeScript monorepo with separate applications for Kynovia SaaS backoffice, condominium administration, gatehouse operations, and mobile/PWA experiences.

## Stack

- Next.js for web applications
- TypeScript across apps, packages, and Supabase Edge Functions
- Tailwind CSS for UI styling
- Supabase for Postgres, Auth, Realtime, Storage, and Edge Functions
- pnpm workspaces for package management
- Turborepo for task orchestration
- GitHub Actions for lint, typecheck, test, and build validation

## Monorepo Layout

```txt
apps/
  kynovia-admin/   Internal Kynovia SaaS backoffice shell
  condo-admin/     Condominium customer administration shell
  web-admin/       Legacy admin app kept during migration
  web-portaria/    Gatehouse web app for access desk workflows
  mobile-pwa/      Mobile-first PWA shell
packages/
  ui/              Shared React UI primitives
  database/        Supabase client helpers and database types
  auth/            Auth boundaries and session helpers
  access-engine/   Access decision domain contracts
  integrations/    External integration contracts
supabase/
  migrations/      Database migrations
  functions/       Supabase Edge Functions
  seed.sql         Local development seed data
```

## Getting Started

Prerequisites:

- Node.js 20+
- pnpm 9+
- Supabase CLI for local Supabase workflows

Install dependencies:

```bash
corepack enable
pnpm install
```

Copy the environment template:

```bash
cp .env.example .env.local
```

Run development apps:

```bash
pnpm dev
```

Run validation:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment Readiness

The repository is prepared for future deployment to:

- Vercel, using one project per app under `apps/*`
- Supabase, using migrations and Edge Functions under `supabase/*`

Deployment credentials are intentionally not committed. Configure the variables listed in `.env.example` in Vercel, Supabase, and GitHub Actions when deployment pipelines are added.

## Current Scope

`apps/kynovia-admin` and `apps/condo-admin` currently contain only authenticated app shells. Existing admin functionality remains in `apps/web-admin` until each workflow is migrated in a focused PR.
