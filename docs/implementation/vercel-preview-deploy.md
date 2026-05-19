# Vercel Preview Deployment Setup

This guide prepares Kynovia Access for DEV/Preview deployments on Vercel so the team can validate frontend builds, routes, and UI behavior.

It does **not** approve operational pilot execution, production deployment, real hardware activation, or use of real sensitive data.

> **Deploy Vercel Preview não libera piloto operacional enquanto Supabase DEV estiver com drift.**

## Scope

Vercel Preview is allowed only for:

- Next.js build validation.
- Route and navigation validation.
- UI review on shared URLs.
- DEV-only integration checks against Supabase DEV after environment variables are configured.

Vercel Preview is not allowed for:

- Production usage.
- Real gate, relay, camera, LPR, facial, or biometric hardware.
- Applying pilot seed data.
- Treating the system as ready for the operational pilot before Supabase DEV drift is resolved.

## Project Model

Create one Vercel project per app. Do not deploy the monorepo root as a single runtime app.

| Vercel project | Root Directory | Framework |
| --- | --- | --- |
| `kynovia-web-admin` | `apps/web-admin` | Next.js |
| `kynovia-web-portaria` | `apps/web-portaria` | Next.js |
| `kynovia-mobile-pwa` | `apps/mobile-pwa` | Next.js |

Each project should connect to the same GitHub repository:

```text
kynoviabr/kynovia_access
```

## Environment

Configure variables in the Vercel **Preview** environment. Preview must point to Supabase DEV.

Required variables for each Vercel project:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_ENV=development
```

Rules:

- Use the Supabase DEV URL and anon key only.
- Do not configure STAGING or PROD values for Preview.
- Never add `SUPABASE_SERVICE_ROLE_KEY` to Vercel frontend projects.
- Never add private provider tokens, webhook signing secrets, hardware credentials, or database passwords to frontend projects.
- Keep `NEXT_PUBLIC_APP_ENV=development` until there is an explicit staging or production approval.

## Build Settings

Vercel should auto-detect Next.js for each project after the Root Directory is set.

Recommended settings:

| Setting | Value |
| --- | --- |
| Install Command | `pnpm install` |
| Build Command | Vercel default for Next.js, or `pnpm build` |
| Output Directory | Vercel default |
| Node.js Version | Project default unless Vercel requires an explicit supported version |

Do not add custom deploy commands that apply Supabase migrations, load seed data, or call hardware providers.

## GitHub Integration

Connect the repository through Vercel's GitHub integration:

1. Import `kynoviabr/kynovia_access`.
2. Create/select the Vercel project for the target app.
3. Set the Root Directory.
4. Confirm the framework is detected as Next.js.
5. Configure Preview environment variables.
6. Let Vercel create Preview deployments for pull requests.

Preview URLs should be used in PR review notes for UI and route validation only.

## Deploy Checklist

Use this checklist for each app project.

- [ ] GitHub repository connected.
- [ ] Vercel project created separately for the app.
- [ ] Root Directory set correctly.
- [ ] Framework detected as Next.js.
- [ ] Install command uses `pnpm install`.
- [ ] Build command works for the selected app.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured for Supabase DEV.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured for Supabase DEV.
- [ ] `NEXT_PUBLIC_APP_ENV=development` configured.
- [ ] No service role key configured.
- [ ] No private provider token configured.
- [ ] No hardware credential configured.
- [ ] Preview deployment generated from a pull request.
- [ ] Preview URL reviewed for build, routes, and UI only.
- [ ] PR notes clearly state that Preview is not an operational pilot approval.

## App-Specific Notes

### `apps/web-admin`

Purpose: administrative workflows and management UI.

Use Preview to validate:

- Login and route rendering.
- Dashboard route availability.
- Condominium, resident, visitor, and invite screens render without build/runtime failures.
- Layout and visual consistency.

Do not use Preview to approve real condominium administration.

### `apps/web-portaria`

Purpose: gatehouse/operator workflows.

Use Preview to validate:

- Login and dashboard route rendering.
- Operator-facing pages render without build/runtime failures.
- Invite and access-related UI states can be reviewed visually.

Do not use Preview to trigger or simulate real gate opening.

### `apps/mobile-pwa`

Purpose: resident mobile/PWA shell.

Use Preview to validate:

- Login and mobile home route rendering.
- Invite flow UI rendering.
- Mobile viewport behavior.
- PWA shell layout.

Do not use Preview to invite real visitors or collect real resident data.

## Readiness Boundary

The latest readiness audit keeps the project in `NO-GO` for operational pre-pilot execution until Supabase DEV migration drift is resolved.

Vercel Preview can proceed before that fix only because it validates frontend build and UI readiness. It must not be presented as pilot readiness, production readiness, or hardware readiness.

Before any operational pilot starts:

1. Reconcile Supabase DEV migrations.
2. Re-run Supabase Security Advisor.
3. Re-run Supabase Performance Advisor and triage warnings.
4. Apply the fictitious DEV seed only after schema readiness is confirmed.
5. Capture Vercel Preview links for the three apps.
6. Execute the operational pilot checklist.
