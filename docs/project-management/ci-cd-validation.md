# CI/CD Validation

This document records the baseline GitHub Actions validation for Kynovia Access.

## Workflow

The baseline workflow is `.github/workflows/ci.yml`.

It runs on:

- Pull Requests.
- Pushes to `main`.
- Manual dispatch through GitHub Actions.

The workflow uses read-only repository contents permission and cancels older in-progress runs for the same ref.

## Required Jobs

The required validation sequence is:

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm lint`.
3. Run `pnpm typecheck`.
4. Run `pnpm test`.
5. Run `pnpm build`.

Any failed step must fail the CI run.

## Local Equivalence

Before opening or updating a Pull Request, developers and Codex must run the same commands locally:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Use `corepack enable` and `pnpm install` first when dependencies are not installed.

## Evidence

Each infrastructure or scaffold PR should include:

- Commands executed locally.
- CI result after push.
- Known warnings or limitations.
- Confirmation that no unrelated app, package, Supabase, or feature scope was changed.

## Current Known Warning

Next.js may warn that the Next ESLint plugin is not detected in the flat ESLint configuration during `next build`. This warning does not currently fail lint, typecheck, test, or build.
