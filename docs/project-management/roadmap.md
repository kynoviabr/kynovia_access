# Roadmap

This roadmap organizes Kynovia Access into delivery phases. It is directional and should be refined through issues and PRs.

## Phase 0: Foundation

Goal: establish the repository, tooling, governance, and deployment-ready structure.

- Monorepo scaffold
- GitHub governance
- CI validation
- Supabase folder structure
- Documentation baseline

## Phase 1: Authentication And Tenant Context

Goal: establish secure user identity and condominium-aware access boundaries.

- Supabase Auth integration
- Tenant and condominium context model
- Initial RLS policies
- Session handling across apps
- Auth package boundaries

## Phase 2: Admin Setup

Goal: allow administrators to configure the first operational entities.

- Tenant onboarding
- Condominium setup
- User and role management
- Access point registration
- Administrative audit foundations

## Phase 3: Gatehouse Operations

Goal: support core portaria workflows.

- Operator dashboard
- Visitor lookup and registration
- Access request handling
- Access event logging
- Basic incident notes

## Phase 4: Access Engine

Goal: centralize access decisions in a reusable domain layer.

- Access evaluation contracts
- Policy inputs and outputs
- Decision reasons
- Audit-friendly decision records
- Regression tests for access decisions

## Phase 5: Mobile PWA

Goal: provide mobile-first resident and authorized-user workflows.

- PWA shell hardening
- Resident identity context
- Visitor pre-authorization flow
- Mobile notifications strategy
- Offline and network-failure behavior review

## Phase 6: Integrations

Goal: connect external communication and operational providers safely.

- Environment-variable contracts
- Webhook verification
- WhatsApp/email/SMS provider abstraction
- Integration event logging
- Retry and failure handling

## Phase 7: Operational Hardening

Goal: prepare for production-grade operation.

- Observability
- Security review
- Backup and recovery notes
- Performance review
- Deployment runbooks
- Incident response process
