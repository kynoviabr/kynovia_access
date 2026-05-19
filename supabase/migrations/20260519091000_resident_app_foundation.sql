create table if not exists public.resident_favorite_visitors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  resident_id uuid not null references public.residents(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  visitor_name text not null,
  visitor_phone text,
  plate text,
  notes text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resident_access_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  resident_id uuid not null references public.residents(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  visitor_name text not null,
  visitor_phone text,
  plate text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired')),
  requested_by uuid references public.profiles(id) on delete set null,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz,
  expires_at timestamptz not null default (now() + interval '30 minutes'),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists resident_favorite_visitors_set_updated_at on public.resident_favorite_visitors;
drop trigger if exists resident_access_approvals_set_updated_at on public.resident_access_approvals;

create trigger resident_favorite_visitors_set_updated_at
before update on public.resident_favorite_visitors
for each row
execute function public.set_updated_at();

create trigger resident_access_approvals_set_updated_at
before update on public.resident_access_approvals
for each row
execute function public.set_updated_at();

alter table public.resident_favorite_visitors enable row level security;
alter table public.resident_access_approvals enable row level security;

grant select, insert, update on public.resident_favorite_visitors to authenticated;
grant select, insert, update on public.resident_access_approvals to authenticated;

create index if not exists resident_favorite_visitors_tenant_id_idx
  on public.resident_favorite_visitors(tenant_id);

create index if not exists resident_favorite_visitors_condominium_id_idx
  on public.resident_favorite_visitors(condominium_id);

create index if not exists resident_favorite_visitors_resident_id_idx
  on public.resident_favorite_visitors(resident_id);

create index if not exists resident_favorite_visitors_unit_id_idx
  on public.resident_favorite_visitors(unit_id);

create index if not exists resident_favorite_visitors_plate_idx
  on public.resident_favorite_visitors(plate);

create unique index if not exists resident_favorite_visitors_unique_active_idx
  on public.resident_favorite_visitors(resident_id, visitor_name, coalesce(plate, ''))
  where status = 'active';

create index if not exists resident_access_approvals_tenant_id_idx
  on public.resident_access_approvals(tenant_id);

create index if not exists resident_access_approvals_condominium_id_idx
  on public.resident_access_approvals(condominium_id);

create index if not exists resident_access_approvals_resident_id_idx
  on public.resident_access_approvals(resident_id);

create index if not exists resident_access_approvals_unit_id_idx
  on public.resident_access_approvals(unit_id);

create index if not exists resident_access_approvals_status_idx
  on public.resident_access_approvals(status);

create index if not exists resident_access_approvals_expires_at_idx
  on public.resident_access_approvals(expires_at);

create index if not exists resident_access_approvals_requested_by_idx
  on public.resident_access_approvals(requested_by);

create index if not exists resident_access_approvals_decided_by_idx
  on public.resident_access_approvals(decided_by);

drop policy if exists resident_favorite_visitors_select_own on public.resident_favorite_visitors;
drop policy if exists resident_favorite_visitors_insert_own on public.resident_favorite_visitors;
drop policy if exists resident_favorite_visitors_update_own on public.resident_favorite_visitors;
drop policy if exists resident_access_approvals_select_accessible on public.resident_access_approvals;
drop policy if exists resident_access_approvals_insert_operators on public.resident_access_approvals;
drop policy if exists resident_access_approvals_update_residents on public.resident_access_approvals;
drop policy if exists resident_access_approvals_update_operators on public.resident_access_approvals;

create policy resident_favorite_visitors_select_own
  on public.resident_favorite_visitors
  for select
  to authenticated
  using (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_favorite_visitors_insert_own
  on public.resident_favorite_visitors
  for insert
  to authenticated
  with check (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_favorite_visitors_update_own
  on public.resident_favorite_visitors
  for update
  to authenticated
  using (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  )
  with check (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_access_approvals_select_accessible
  on public.resident_access_approvals
  for select
  to authenticated
  using (
    public.can_operate_condominium(condominium_id)
    or exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_access_approvals_insert_operators
  on public.resident_access_approvals
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy resident_access_approvals_update_residents
  on public.resident_access_approvals
  for update
  to authenticated
  using (
    status = 'pending'
    and expires_at > now()
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  )
  with check (
    status in ('approved', 'rejected')
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_access_approvals_update_operators
  on public.resident_access_approvals
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));
