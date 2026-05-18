# Pre-PR Validation

Every Pull Request must pass through a validation and correction cycle before it is opened for review.

## Mandatory Cycle

1. Implement the change.
2. Run lint.
3. Fix lint issues.
4. Run typecheck.
5. Fix type errors.
6. Run build.
7. Fix build failures.
8. Run automated tests when they exist.
9. Fix bugs found by tests.
10. Manually test the affected flow.
11. Only then open the Pull Request.

## Commands

Use the standard commands when available:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm test
```

Run `pnpm test` when the script exists. Also run focused tests for changed apps, packages, database behavior, integrations, or access-engine rules when those tests exist.

## Correction Rule

Validation is not only a reporting step. Any failure found before a PR must be corrected before the PR is opened.

If a failure cannot be corrected within the PR scope, the PR should not be opened unless the limitation is explicitly documented and linked to a follow-up issue.

## Manual Testing

Manual testing is required when the change affects a user-facing or operational flow.

Document:

- Flow tested
- Environment used
- Result observed
- Known limitations

## Codex Expectations

Codex-authored changes must follow the same cycle:

- Run available validation commands.
- Fix failures before opening or updating the PR.
- State unavailable commands clearly.
- Avoid opening PRs with known critical TODOs unless a related issue exists.
