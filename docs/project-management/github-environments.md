# GitHub Environments

Kynovia Access uses GitHub Environments to separate configuration for development, staging, and production workflows.

## Environments

| Environment | Purpose | Deployment branch policy |
| --- | --- | --- |
| `development` | Internal development validation and future DEV deploys. | Protected branches only |
| `staging` | Pre-production validation and release candidate deploys. | Protected branches only |
| `production` | Production deploy target. | Protected branches only |

## Placeholder Variables

Each environment includes non-secret placeholder variables to document the expected configuration contract:

- `APP_ENV`
- `NEXT_PUBLIC_APP_ENV`
- `ENVIRONMENT_URL_PLACEHOLDER`
- `REQUIRED_SECRETS_PLACEHOLDER`

`REQUIRED_SECRETS_PLACEHOLDER` lists the secret names expected before deployment workflows are enabled.

## Required Secret Names

These values must be configured as GitHub Environment secrets when the corresponding provider is provisioned:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PROJECT_ID`
- `SUPABASE_DB_PASSWORD`
- `SUPABASE_ACCESS_TOKEN`
- `AUTH_JWT_SECRET`
- `WEBHOOK_SIGNING_SECRET`
- `WHATSAPP_API_TOKEN`
- `SMS_API_TOKEN`
- `SENTRY_DSN`
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID_WEB_ADMIN`
- `VERCEL_PROJECT_ID_WEB_PORTARIA`
- `VERCEL_PROJECT_ID_MOBILE_PWA`

Do not use placeholder values for real deployments. Secrets must be configured with provider-managed values and rotated when exposed.

## Current Scope

The environments are ready for future CI/CD wiring. No deployment workflow is enabled yet.
