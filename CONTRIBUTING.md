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

Recommended prefixes:

- `feature/` for product capabilities.
- `fix/` for defects.
- `docs/` for documentation-only work.
- `chore/` for maintenance and tooling.
- `security/` for hardening work.
- `codex/` for Codex-authored branches.

Branch names should be lowercase, hyphenated, and scoped to one outcome.

## Commits

Use short imperative commit messages:

```txt
Add tenant context contracts
Fix access point seed data
Document GitHub workflow
```

Keep commits focused. Avoid mixing functional code, database migrations, and documentation cleanup unless they are part of the same change.

## Pull Requests

Every PR should include:

- Summary of what changed.
- Why the change is needed.
- Linked issue when applicable.
- Validation commands.
- Migration notes when database changes are included.
- Environment variable notes when configuration changes.
- Screenshots for meaningful UI changes.

PRs should avoid unrelated changes. If a follow-up depends on an open PR, open a stacked PR and make the base branch clear.

No PR should be opened until the author has run and fixed failures from:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`, when available
- `pnpm build`
- Tests specific to the changed area, when available

If a command is unavailable, the PR must explain why and describe the substitute validation used. Known bugs, skipped tests, or unresolved limitations must be documented before review.

## Review Rules

- At least one review is expected before merging non-trivial changes.
- Security-sensitive changes require explicit review of auth, secrets, tenant boundaries, and RLS impact.
- Database changes require migration review.
- PRs should not merge with failing CI.
- The author is responsible for keeping the PR current with its base branch.

## Validation

Before opening a PR, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Run `pnpm test` when the script exists. Also run focused tests for the area changed, such as package, app, database, integration, or access-engine tests. Fix failures before requesting review.

## Code Standards

- TypeScript is required for application and package code.
- Prefer explicit exported types for shared package APIs.
- Keep UI-specific behavior in apps or `packages/ui`.
- Keep domain logic in domain packages.
- Keep database changes in Supabase migrations.

## Secrets

Never commit local secrets, service role keys, API tokens, or `.env.local`.
