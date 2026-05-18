# Definition of Ready and Done

This document defines the minimum governance standards for moving work into implementation and accepting completed work.

## Definition of Ready

A Story, Task, Bug, or Security issue is ready when:

- The objective is clear and linked to the correct Epic when applicable.
- Scope and out-of-scope items are explicit.
- Acceptance criteria are specific enough to validate.
- Dependencies, blockers, environment needs, and external services are identified.
- Security, tenant isolation, RLS, secrets, and data privacy impact are considered when relevant.
- Database changes are expected to use Supabase migrations.
- Validation expectations are known before implementation starts.
- The work can fit in one focused PR or has been split into smaller issues.

Only phase `01-foundation` work should move to ready while the project is still in foundation mode.

## Definition of Done

Work is done when:

- Acceptance criteria are satisfied.
- The implementation is scoped to the linked issue.
- Required documentation is updated.
- New or changed behavior has a basic automated test or documented validation path.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm build` pass before PR review.
- CI passes on the Pull Request.
- Security-sensitive changes have explicit review of auth, secrets, tenant boundaries, and RLS impact.
- Known limitations are documented in the PR body or linked follow-up issue.
- The PR is reviewed, merged into `main`, and the linked issue is closed with evidence.

Configuration-only stories may be closed without a PR when the evidence is recorded directly on the GitHub issue.
