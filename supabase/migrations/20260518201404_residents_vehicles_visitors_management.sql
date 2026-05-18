alter table public.residents
  add column if not exists block_reason text,
  add column if not exists blocked_at timestamptz;

alter table public.resident_vehicles
  add column if not exists block_reason text,
  add column if not exists blocked_at timestamptz;

create table if not exists public.visitor_unit_visits (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  occurred_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists visitor_unit_visits_set_updated_at on public.visitor_unit_visits;

create trigger visitor_unit_visits_set_updated_at
before update on public.visitor_unit_visits
for each row execute function public.set_updated_at();

alter table public.visitor_unit_visits enable row level security;

create index if not exists visitor_unit_visits_tenant_id_idx
  on public.visitor_unit_visits(tenant_id);

create index if not exists visitor_unit_visits_condominium_id_idx
  on public.visitor_unit_visits(condominium_id);

create index if not exists visitor_unit_visits_unit_id_idx
  on public.visitor_unit_visits(unit_id);

create index if not exists visitor_unit_visits_visitor_id_idx
  on public.visitor_unit_visits(visitor_id);

create index if not exists visitor_unit_visits_occurred_at_idx
  on public.visitor_unit_visits(occurred_at);

drop policy if exists visitor_unit_visits_select_accessible on public.visitor_unit_visits;
drop policy if exists visitor_unit_visits_insert_operators on public.visitor_unit_visits;
drop policy if exists visitor_unit_visits_update_operators on public.visitor_unit_visits;
drop policy if exists visitor_unit_visits_delete_operators on public.visitor_unit_visits;

create policy visitor_unit_visits_select_accessible
  on public.visitor_unit_visits
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy visitor_unit_visits_insert_operators
  on public.visitor_unit_visits
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy visitor_unit_visits_update_operators
  on public.visitor_unit_visits
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy visitor_unit_visits_delete_operators
  on public.visitor_unit_visits
  for delete
  to authenticated
  using (public.can_operate_condominium(condominium_id));
