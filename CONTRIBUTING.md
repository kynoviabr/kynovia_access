# Contributing

Thanks for contributing to Kynovia Access.

## Workflow

1. Create a branch from `main`.
2. Keep changes focused and aligned with the package/app boundaries.
3. Update docs when behavior, architecture, database shape, or setup changes.
4. Run local validation before opening a pull request.
5. Use the pull request template and include migration or environment notes when relevant.

## Branches

Use descriptive branch names:

```txt
feature/tenant-context
fix/access-policy-check
docs/database-rls-model
codex/initial-project-structure
```

## Validation

Run:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Code Standards

- TypeScript is required for application and package code.
- Prefer explicit exported types for shared package APIs.
- Keep UI-specific behavior in apps or `packages/ui`.
- Keep domain logic in domain packages.
- Keep database changes in Supabase migrations.

## Secrets

Never commit local secrets, service role keys, API tokens, or `.env.local`.
