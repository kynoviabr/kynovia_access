# Database

This section documents the Supabase/Postgres data model.

## Source Of Truth

Database structure is defined in `supabase/migrations`.

Local seed data is defined in `supabase/seed.sql`.

## Initial Model

The first migration establishes base multi-tenant tables:

- `tenants`
- `condominiums`
- `profiles`
- `access_points`

Row Level Security is enabled on the initial tables. Concrete policies will be added with the first authenticated product flows.

## Conventions

- Use UUID primary keys.
- Include `tenant_id` on tenant-owned records.
- Add indexes for tenant and parent lookup paths.
- Keep migrations append-only after they have been applied to shared environments.
- Document generated database types when Supabase type generation is introduced.
