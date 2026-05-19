# Pilot Plan

## Objective

Validate Kynovia Access in a realistic but controlled condominium operation before production use.

The pilot should prove that administrators, gatehouse operators, and residents can complete the
core access workflows with clear auditability, safe tenant boundaries, and predictable fallback
paths.

## Pilot Condominium

Use a fictitious DEV condominium:

- Name: Residencial Piloto Aurora
- Environment: DEV only
- Tenant: Kynovia Demo
- Units: 3
- Gatehouse: main gatehouse
- Access points: pedestrian gate, vehicle gate, service gate
- Operators: simulated only
- Residents and visitors: fictitious records only

## Timeline

| Step | Owner | Duration | Output |
| --- | --- | --- | --- |
| Readiness review | Product + Engineering | 1 day | Checklist signed off |
| Data setup | Engineering | 1 day | DEV seed applied |
| Gatehouse test run | Operations + Engineering | 1 day | Test evidence |
| Resident test run | Product + Operations | 1 day | Feedback notes |
| Issue triage | Product + Engineering | 1 day | Fix backlog |
| Pilot report | Product | 1 day | Go/no-go recommendation |

## Pilot Roles

- Pilot lead: coordinates execution and final report.
- Technical lead: validates environment, seed data, CI, and database state.
- Gatehouse observer: records operator friction and failure points.
- Resident observer: records mobile/PWA usability feedback.
- Reviewer: approves post-pilot roadmap decision.

## Entry Criteria

- PRs through Phase 15 merged.
- DEV environment available.
- Latest migrations applied to DEV through the approved deployment flow.
- No Supabase Security Advisor critical or warning security lints.
- Seed data loaded with fictitious records.
- Operators understand that hardware commands are mock-only.
- Test scripts reviewed before execution.

## Exit Criteria

- All mandatory test scripts executed.
- Failures and workarounds documented.
- Gatehouse and resident feedback collected.
- Acceptance matrix completed.
- Post-pilot report produced.
- Roadmap decision approved: continue, repeat pilot, or pause for fixes.
