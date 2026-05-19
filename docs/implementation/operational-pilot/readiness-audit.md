# Operational Pilot Readiness Audit

Date: 2026-05-19

Scope: final readiness review after Phase 16 for a DEV-only operational pre-pilot. This audit does not approve production use, real hardware activation, or use of sensitive real data.

## Recommendation

Status: **NO-GO for DEV pre-pilot execution until Supabase DEV migration drift is resolved**.

The repository and GitHub workflow are ready for controlled pre-pilot preparation, but the DEV database is not yet ready to run the Phase 16 pilot seed or end-to-end pilot scripts. The Supabase DEV migration history does not match the local migration set, and schema checks show that Phase 14 and Phase 15 database objects are not currently present in DEV.

## Phase Status

| Phase | Status | Evidence |
| --- | --- | --- |
| 01-05 | Merged into main | Current main contains foundation, Supabase/security, auth, condominium, and residents/visitors work. |
| 06 | Merged | PR #173 merged on 2026-05-19. |
| 07 | Merged | PR #174 merged on 2026-05-19. |
| 08 | Merged | PR #175 merged on 2026-05-19. |
| 09 | Merged | PR #176 merged on 2026-05-19. |
| 10 | Merged | PR #177 merged on 2026-05-19. |
| 11 | Merged | PR #178 merged on 2026-05-19. |
| 12 | Merged | PR #179 merged on 2026-05-19. |
| 13 | Merged | PR #180 merged on 2026-05-19. |
| 14 | Merged in GitHub | PR #181 merged on 2026-05-19, but DEV schema verification did not find the expected Phase 14 schema additions. |
| 15 | Merged in GitHub | PR #182 merged on 2026-05-19, but DEV schema verification did not find the expected Phase 15 tables. |
| 16 | Merged in GitHub | PR #183 merged on 2026-05-19. |

Open PR status: no open PRs were found that are related to Phases 01-16 at the time of this audit.

## Technical Status

| Area | Status | Notes |
| --- | --- | --- |
| Main branch CI | Pass | GitHub check `Lint, typecheck, test, and build` completed successfully on main commit `ade26ad29e79cf4f057791f7da29a27ff3719ad4`. |
| Local lint | Pass | `corepack pnpm lint` completed successfully. |
| Local typecheck | Pass | `corepack pnpm typecheck` completed successfully. |
| Local tests | Pass | `corepack pnpm test` completed successfully. |
| Local build | Pass | `corepack pnpm build` completed successfully. |
| Diff hygiene | Pass | `git diff --check` completed successfully. |
| Apps/packages scope | Pass | This audit PR changes documentation only. No app, package, or Supabase migration is changed. |
| Secrets scan | Pass | No real GitHub token, service role value, API key, or provider token was found in the repository scan. Placeholder variables remain in `.env.example`. |

## Supabase Status

| Check | Status | Notes |
| --- | --- | --- |
| DEV project reachable | Pass | Supabase DEV responded to MCP SQL and advisor checks. |
| Security Advisor | Pass | Security Advisor returned `lints: []`. |
| Performance Advisor | Needs follow-up | No critical performance blocker was identified, but the advisor reports `WARN` items for multiple permissive RLS policies and `INFO` items for unindexed foreign keys and unused indexes. These should be triaged before heavy pilot traffic. |
| Local migrations present | Pass | The repository contains 19 migration files under `supabase/migrations`. |
| DEV migration history aligned | Fail | `supabase_migrations.schema_migrations` in DEV contains 17 versions, and those versions do not align with the local migration filenames. |
| Phase 14 schema in DEV | Fail | Expected audit/compliance additions such as `audit_retention_policies`, `audit_log_export_requests`, and new `audit_logs` columns were not found in DEV. |
| Phase 15 schema in DEV | Fail | Expected operational AI tables such as `operational_ai_analyses` and `operational_ai_alerts` were not found in DEV. |
| Phase 16 seed readiness | Blocked | The Phase 16 seed references `operational_ai_analyses` and `operational_ai_alerts`; it should not be applied until DEV includes the Phase 15 schema. |

Observed local migration files include Phase 14 and Phase 15:

- `20260519092000_audit_compliance_foundation.sql`
- `20260519093000_operational_ai_foundation.sql`

Observed DEV migration history used different version values and did not include the local filenames directly. This needs an explicit migration reconciliation step before pilot data is loaded.

## Pilot Documentation Status

| Document | Status |
| --- | --- |
| `README.md` | Present |
| `pilot-plan.md` | Present |
| `deployment-checklist.md` | Present |
| `test-scripts.md` | Present |
| `acceptance-matrix.md` | Present |
| `gatehouse-feedback.md` | Present |
| `resident-feedback.md` | Present |
| `post-pilot-report-template.md` | Present |
| `pilot-data.md` | Present |

The pilot documentation covers the required plan, deployment checklist, operational scripts, acceptance criteria, feedback routines, and post-pilot reporting template.

## DEV Seed Status

The repository contains fictitious DEV pilot data for:

- Condominium: `Residencial Piloto Aurora`
- Resident vehicle entry scenario: `PIL1A01`
- Visitor plate scenario: `PIL2B02`
- Blocked plate scenario: `BLK3C03`
- QR invite scenario: `dev-pilot-qr-token-hash`

The data is suitable for DEV-only validation after database migration drift is resolved. It must not be used in STAGING, PROD, or with real residents, real documents, real plates, or real phone numbers.

## STAGING and PROD Status

STAGING and PROD remain intentionally blocked:

- `docs/database/supabase-projects.md` lists STAGING and PROD as pending.
- The documented reason is cost confirmation and environment separation.
- `.env.example` contains placeholders only for STAGING and PROD variables.
- No production deployment approval was found or assumed during this audit.

## Known Risks

1. Supabase DEV migration drift blocks reliable pilot execution.
2. Phase 16 seed should fail or partially fail if applied before Phase 15 tables exist in DEV.
3. Performance Advisor has non-critical warnings that should be triaged before larger traffic volumes.
4. Pilot test scripts still require manual execution and evidence capture.
5. Vercel preview/staging deployment is not yet confirmed as configured for the three apps.
6. No real hardware provider should be configured until the mock-only pilot is completed and approved.

## Pending Work Before Pilot

1. Reconcile Supabase DEV migration history with repository migrations.
2. Apply or repair missing DEV schema for Phase 14 and Phase 15.
3. Re-run Supabase Security Advisor after migration reconciliation.
4. Re-run Supabase Performance Advisor and record accepted warnings.
5. Apply the Phase 16 DEV seed only after schema readiness is confirmed.
6. Configure Vercel Preview deployments for `apps/web-admin`, `apps/web-portaria`, and `apps/mobile-pwa` against Supabase DEV.
7. Execute the pilot deployment checklist.
8. Capture evidence for each operational pilot test script.

## Go/No-Go Checklist

| Item | Status |
| --- | --- |
| Phases 01-16 merged into main | GO |
| No open phase PRs pending | GO |
| Main CI green | GO |
| Local validation cycle green | GO |
| Security Advisor clean | GO |
| No real secrets in repository | GO |
| Pilot documentation complete | GO |
| DEV seed is fictitious | GO |
| STAGING/PROD blocked | GO |
| DEV migrations aligned with repository | NO-GO |
| Phase 14 schema present in DEV | NO-GO |
| Phase 15 schema present in DEV | NO-GO |
| Phase 16 seed safe to apply now | NO-GO |
| Vercel Preview confirmed | NO-GO |

## Final Recommendation

Do not start the operational pre-pilot yet.

The project is ready from a repository, documentation, and CI perspective, but Supabase DEV must be reconciled before pilot execution. Once DEV migration drift is fixed, re-run this audit, apply the fictitious seed, configure Vercel Preview against DEV, and execute the test scripts with captured evidence.
