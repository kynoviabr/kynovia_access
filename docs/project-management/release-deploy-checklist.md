# Release and Deploy Checklist

Use this checklist before enabling or executing deployments for Kynovia Access.

## Pre-Release

- Confirm the release scope and linked issues.
- Confirm all included PRs are merged into `main`.
- Confirm GitHub Actions passed on `main`.
- Confirm database migrations are reviewed and ordered.
- Confirm no local-only configuration is required.
- Confirm environment variables and secrets are configured for the target environment.
- Confirm rollback notes exist for risky changes.

## Validation

Run or verify:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For database or Supabase changes, also verify:

- Migration files are committed.
- Seed data is safe for development only.
- RLS and tenant isolation are considered.
- Service role keys are not exposed to frontend code.

## Deployment Readiness

- Vercel projects are mapped to the correct app under `apps/*`.
- Supabase project references match the target environment.
- GitHub Environment secrets are configured with real values.
- Deployment workflow uses the correct GitHub Environment.
- Production deploys require explicit review once deploy workflows are introduced.

## Post-Deploy

- Confirm the deployed app responds.
- Confirm critical logs do not show startup or migration errors.
- Confirm no secrets appear in logs.
- Record deployment evidence in the release issue or PR.
- Create follow-up issues for any known limitation.

No production deployment should proceed from placeholder secrets or local-only state.
