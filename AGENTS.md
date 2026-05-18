# AGENTS.md

## Project Context

Kynovia Access is a SaaS platform for access control in condominiums and gatehouse operations.

Keep the architecture modular, secure, and tenant-aware from the first implementation.

## Stack

- Next.js
- React
- Tailwind CSS
- Supabase
- PostgreSQL
- Supabase Edge Functions
- TypeScript

## Priorities

When trade-offs are necessary, use this order:

1. Security
2. Stability
3. Operational simplicity
4. Clear UX
5. Scalability

## Development Rules

- Use TypeScript for all application, package, and Edge Function code.
- Do not create integrations without corresponding environment variables in `.env.example`.
- Never expose the Supabase service role key or private integration tokens in frontend code.
- Every tenant-owned table must consider condominium-level tenancy through `condominium_id` or an explicitly documented tenant boundary.
- Every sensitive table must have Row Level Security enabled.
- Every database change must be made through a Supabase migration.
- Every feature must include at least a basic test or a documented validation path when automated tests are not yet available.
- No feature may depend on a developer's local machine state.
- Always work through a branch and Pull Request.
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
pnpm test
pnpm build
```

If dependencies are not installed, run `corepack enable && pnpm install` first.

## Mandatory Pre-PR Validation Cycle

Codex must not open a Pull Request until the validation cycle has been completed and any discovered failures have been corrected.

Required cycle:

1. Implement the change.
2. Run `pnpm lint`.
3. Fix lint failures.
4. Run `pnpm typecheck`.
5. Fix type errors.
6. Run `pnpm test` when the script exists.
7. Fix bugs found by automated tests.
8. Run `pnpm build`.
9. Fix build failures.
10. Run tests specific to the changed area when available.
11. Fix bugs found by area-specific tests.
12. Manually test the affected flow when a user-facing or operational flow changes.
13. Document known limitations, skipped checks, or unavailable tests in the PR body.
14. Only then open or update the Pull Request.

If a validation command cannot run because the project lacks the script or required external service, state that explicitly in the PR body and provide the best available substitute validation. Do not ignore failing checks.

## Environment

Use `.env.example` as the public contract for required variables. Keep local values in `.env.local` or provider-managed secret stores.
