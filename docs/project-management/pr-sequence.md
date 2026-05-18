# PR Sequence

This document proposes an ideal Pull Request sequence for building Kynovia Access after the initial scaffold.

## Principles

- Keep PRs small and reviewable.
- Land foundations before product workflows.
- Add database changes through migrations only.
- Add tests or documented validation with each feature.
- Prefer package contracts before cross-app implementation.

## Recommended Sequence

1. Configure GitHub project governance
   - Issue templates
   - Project management docs
   - Contribution rules
   - Definition of Ready and Definition of Done
   - Release/deploy checklist

2. Add test framework baseline
   - Unit test runner
   - Shared test scripts
   - CI integration

3. Generate and wire Supabase database types
   - Type generation command
   - Database package exports
   - Documentation for regeneration

4. Define authentication architecture
   - Auth package contracts
   - Session boundaries
   - Server/client key usage rules

5. Add tenant and condominium RLS policies
   - Policy migration
   - Policy validation notes
   - Security documentation update

6. Implement admin app shell structure
   - App navigation
   - Layout primitives
   - No business features yet

7. Implement portaria app shell structure
   - Operator layout
   - Access desk navigation
   - No access workflow yet

8. Implement mobile PWA shell hardening
   - Manifest completeness
   - Installability baseline
   - Mobile layout conventions

9. Add tenant onboarding foundations
   - Database migrations
   - Admin-facing setup flow
   - Basic validation and tests

10. Add access point management
    - Admin CRUD workflow
    - RLS coverage
    - Audit notes

11. Add access engine decision contracts
    - Deterministic input/output types
    - Unit tests
    - Documentation examples

12. Add gatehouse visitor workflow
    - Operator UX
    - Access event persistence
    - Validation and audit coverage

13. Add integration provider contracts
    - Environment variables
    - Webhook signatures
    - Failure handling documentation

14. Add production deployment preparation
    - Vercel project notes
    - Supabase deploy notes
    - Secrets checklist
    - Runbooks
