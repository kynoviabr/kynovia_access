# Deployment Checklist

Use this checklist before any pilot execution.

## Environment

- [ ] Confirm target environment is DEV.
- [ ] Confirm Supabase project is the DEV project.
- [ ] Confirm Vercel previews or local app URLs point to DEV variables.
- [ ] Confirm no production data is present.
- [ ] Confirm no real hardware relay URL is configured.
- [ ] Confirm AI, LPR, facial, and gate providers are mock or disabled.

## Database

- [ ] Confirm latest main branch is deployed.
- [ ] Confirm all migrations through Phase 15 are applied.
- [ ] Confirm `supabase/seed.sql` was applied to DEV.
- [ ] Confirm pilot tenant, condominium, units, residents, visitors, invites, access events, and
  alerts exist.
- [ ] Confirm Supabase Security Advisor has no security lints.

## Applications

- [ ] Admin app opens.
- [ ] Gatehouse app opens.
- [ ] Mobile PWA opens.
- [ ] Login and route protection behavior is understood for the test accounts available in DEV.
- [ ] No service role key is exposed in browser environment variables.

## Operations

- [ ] Gatehouse test observer assigned.
- [ ] Resident test observer assigned.
- [ ] Feedback capture document ready.
- [ ] Known limitations reviewed with pilot participants.
- [ ] Rollback path documented as stopping the pilot and reverting to manual procedures.

## Safety

- [ ] No real gate, relay, camera, LPR, facial, or biometric hardware will be triggered.
- [ ] All names, phones, documents, plates, and emails are fictitious.
- [ ] Any issue involving real personal data stops the pilot immediately.
