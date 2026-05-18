# AGENTS.md

## Project

Kynovia Access is a multi-condominium access control SaaS. Keep the architecture modular and tenant-aware from the first implementation.

## Development Rules

- Use TypeScript for all application and package code.
- Keep domain logic out of UI apps when it belongs in shared packages.
- Prefer small, explicit package APIs exported from `src/index.ts`.
- Treat Supabase migrations as the source of truth for database structure.
- Do not commit secrets, generated build output, local Supabase state, or `.env.local`.
- Keep changes focused. Avoid implementing product features in scaffolding or infrastructure PRs.

## Apps

- `apps/web-admin`: administrative and management workflows.
- `apps/web-portaria`: gatehouse/operator workflows.
- `apps/mobile-pwa`: mobile-first PWA shell.

## Packages

- `@kynovia/ui`: shared React UI primitives.
- `@kynovia/database`: Supabase clients, generated database types, and database helpers.
- `@kynovia/auth`: authentication and authorization boundaries.
- `@kynovia/access-engine`: access decision contracts and future policy engine.
- `@kynovia/integrations`: external provider contracts.

## Quality Checks

Before opening or updating a pull request, run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

If dependencies are not installed, run `corepack enable && pnpm install` first.

## Environment

Use `.env.example` as the public contract for required variables. Keep local values in `.env.local` or provider-managed secret stores.
