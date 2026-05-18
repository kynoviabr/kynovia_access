# Security Policy

## Supported Project Stage

Kynovia Access is in initial platform scaffolding. Security policies and operational procedures will evolve as product features are implemented.

## Reporting A Vulnerability

Please report suspected vulnerabilities privately to:

```txt
kynoviabr@gmail.com
```

Include:

- A clear description of the issue
- Steps to reproduce, when possible
- Impact and affected surfaces
- Any suggested mitigation

Do not open public GitHub issues for security vulnerabilities.

## Security Expectations

- Secrets must remain outside the repository.
- Supabase service role keys must only be used server-side.
- Tenant isolation must be enforced before product data is exposed.
- Database access policies must be reviewed with any schema or auth changes.
- Auditability must be considered for access-control workflows.

## Disclosure

Kynovia will review reports and coordinate remediation before public disclosure when applicable.
