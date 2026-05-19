create table if not exists public.gatehouse_occurrences (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  title text not null,
  description text,
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_by uuid references public.profiles(id) on delete set null,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists gatehouse_occurrences_set_updated_at on public.gatehouse_occurrences;

create trigger gatehouse_occurrences_set_updated_at
before update on public.gatehouse_occurrences
for each row
execute function public.set_updated_at();

alter table public.gatehouse_occurrences enable row level security;

grant select, insert, update on public.gatehouse_occurrences to authenticated;
grant select, insert, update on public.access_events to authenticated;
grant select, insert, update on public.gate_commands to authenticated;
grant select on public.access_points to authenticated;

create index if not exists gatehouse_occurrences_tenant_id_idx
  on public.gatehouse_occurrences(tenant_id);

create index if not exists gatehouse_occurrences_condominium_id_idx
  on public.gatehouse_occurrences(condominium_id);

create index if not exists gatehouse_occurrences_status_idx
  on public.gatehouse_occurrences(status);

create index if not exists gatehouse_occurrences_severity_idx
  on public.gatehouse_occurrences(severity);

create index if not exists gatehouse_occurrences_created_by_idx
  on public.gatehouse_occurrences(created_by);

create index if not exists gatehouse_occurrences_created_at_idx
  on public.gatehouse_occurrences(created_at);

drop policy if exists access_events_update_operators on public.access_events;
drop policy if exists gatehouse_occurrences_select_accessible on public.gatehouse_occurrences;
drop policy if exists gatehouse_occurrences_insert_operators on public.gatehouse_occurrences;
drop policy if exists gatehouse_occurrences_update_operators on public.gatehouse_occurrences;

create policy access_events_update_operators
  on public.access_events
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy gatehouse_occurrences_select_accessible
  on public.gatehouse_occurrences
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy gatehouse_occurrences_insert_operators
  on public.gatehouse_occurrences
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy gatehouse_occurrences_update_operators
  on public.gatehouse_occurrences
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));
