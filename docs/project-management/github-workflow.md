# GitHub Workflow

GitHub is the project management center for Kynovia Access. Issues define work, Pull Requests deliver work, and documentation records decisions.

## Issue Flow

Use issues to describe outcomes before implementation.

Recommended flow:

1. Create an Epic for a major product or platform outcome.
2. Break the Epic into Stories for user-visible behavior.
3. Add Tasks for implementation, infrastructure, documentation, or maintenance work.
4. Use Bugs for defects and Security issues for safe public tracking of hardening work.
5. Link every PR to at least one issue when the work is not pure scaffolding.

## Issue Types

- `type: epic`: large outcome made of multiple stories or tasks.
- `type: story`: user-facing capability or workflow.
- `type: task`: implementation, docs, infrastructure, or maintenance work.
- `type: bug`: incorrect or unexpected behavior.
- `type: security`: security hardening or risk mitigation.

## Pull Request Flow

Use branches and PRs for all changes.

1. Start from the correct base branch.
2. Keep each PR focused on one outcome.
3. Complete the mandatory pre-PR validation cycle.
4. Fix failures from lint, typecheck, build, tests, and area-specific validation.
5. Open the Pull Request only after failures are corrected.
6. Include validation commands in the PR body.
7. Include screenshots for meaningful UI changes.
8. Include migration notes for database changes.
9. Request review before merge.
10. Merge only when checks pass and acceptance criteria are satisfied.

Stacked PRs are allowed for Codex-driven work when a follow-up depends on an open PR. In that case, make the base branch explicit in the PR description.

See `docs/project-management/pre-pr-validation.md` for the required validation and correction cycle.
See `docs/project-management/ci-cd-validation.md` for the baseline GitHub Actions pipeline.

## Labels

Use labels to make work easy to scan.

Recommended labels:

- `type: epic`
- `type: story`
- `type: task`
- `type: bug`
- `type: security`
- `status: triage`
- `status: ready`
- `status: in-progress`
- `status: blocked`
- `status: review`
- `status: done`
- `priority: low`
- `priority: medium`
- `priority: high`
- `priority: critical`
- `area: web-admin`
- `area: web-portaria`
- `area: mobile-pwa`
- `area: database`
- `area: auth`
- `area: access-engine`
- `area: integrations`
- `area: docs`
- `area: ci`

## Status Definitions

- `status: triage`: needs review, scope, or priority.
- `status: ready`: defined and ready for implementation.
- `status: in-progress`: actively being worked.
- `status: blocked`: cannot proceed without a dependency or decision.
- `status: review`: implemented and awaiting review.
- `status: done`: completed and merged or otherwise resolved.

## Acceptance Criteria

Every Story, Task, Bug, and Security issue should include acceptance criteria.

Good acceptance criteria are:

- Specific enough to validate.
- Tenant-aware when data is involved.
- Security-aware when authentication, authorization, or sensitive data is involved.
- Clear about documentation, migration, and validation expectations.

## Codex Compatibility

Codex work should follow the same governance model:

- Work on a branch.
- Keep changes scoped.
- Update docs alongside implementation.
- Run available validation commands before opening a PR.
- Fix validation failures before opening or updating a PR.
- Open or update a PR with a clear summary.
- Avoid secrets in prompts, commits, logs, issues, and PRs.
