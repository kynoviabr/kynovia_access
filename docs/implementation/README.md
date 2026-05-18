# Implementation

This section tracks implementation standards and execution plans.

## Pull Request Expectations

Every implementation PR should include:

- Clear scope and user impact
- Relevant validation commands
- Database migration notes when applicable
- Environment variable changes when applicable
- Screenshots for meaningful UI changes

## Local Validation

Run before opening a PR:

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## Phasing

Suggested implementation phases:

1. Authentication and tenant context
2. Admin onboarding and condominium setup
3. Gatehouse operator workflow
4. Access decision engine
5. Resident/mobile PWA flows
6. Notifications and integrations
7. Audit, reporting, and operational hardening

Each phase should be split into small PRs with migrations and package boundaries reviewed carefully.
