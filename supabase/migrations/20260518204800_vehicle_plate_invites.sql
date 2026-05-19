alter table public.access_invites
  add constraint access_invites_plate_format_check
  check (plate is null or plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$');

alter table public.access_invite_validations
  drop constraint if exists access_invite_validations_result_check;

alter table public.access_invite_validations
  add constraint access_invite_validations_result_check
  check (
    result in (
      'allowed',
      'denied',
      'expired',
      'cancelled',
      'not_started',
      'usage_limit_reached',
      'invalid',
      'blacklisted',
      'parking_full',
      'active_stay_exists',
      'exit_recorded'
    )
  );

create table if not exists public.vehicle_plate_blacklist (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  plate text not null check (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  reason text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condominium_id, plate)
);

create table if not exists public.visitor_vehicle_accesses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  invite_id uuid references public.access_invites(id) on delete set null,
  unit_id uuid references public.units(id) on delete set null,
  plate text not null check (plate ~ '^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$'),
  visitor_name text not null,
  status text not null default 'active' check (status in ('active', 'exited')),
  entered_at timestamptz not null default now(),
  exited_at timestamptz,
  entry_validated_by uuid references public.profiles(id) on delete set null,
  exit_validated_by uuid references public.profiles(id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (exited_at is null or exited_at >= entered_at)
);

drop trigger if exists vehicle_plate_blacklist_set_updated_at on public.vehicle_plate_blacklist;
drop trigger if exists visitor_vehicle_accesses_set_updated_at on public.visitor_vehicle_accesses;

create trigger vehicle_plate_blacklist_set_updated_at
before update on public.vehicle_plate_blacklist
for each row execute function public.set_updated_at();

create trigger visitor_vehicle_accesses_set_updated_at
before update on public.visitor_vehicle_accesses
for each row execute function public.set_updated_at();

alter table public.vehicle_plate_blacklist enable row level security;
alter table public.visitor_vehicle_accesses enable row level security;

grant select, insert, update, delete on public.vehicle_plate_blacklist to authenticated;
grant select, insert, update on public.visitor_vehicle_accesses to authenticated;

create index if not exists vehicle_plate_blacklist_tenant_id_idx
  on public.vehicle_plate_blacklist(tenant_id);

create index if not exists vehicle_plate_blacklist_condominium_id_idx
  on public.vehicle_plate_blacklist(condominium_id);

create index if not exists vehicle_plate_blacklist_plate_idx
  on public.vehicle_plate_blacklist(plate);

create index if not exists vehicle_plate_blacklist_created_by_idx
  on public.vehicle_plate_blacklist(created_by);

create index if not exists visitor_vehicle_accesses_tenant_id_idx
  on public.visitor_vehicle_accesses(tenant_id);

create index if not exists visitor_vehicle_accesses_condominium_id_idx
  on public.visitor_vehicle_accesses(condominium_id);

create index if not exists visitor_vehicle_accesses_invite_id_idx
  on public.visitor_vehicle_accesses(invite_id);

create index if not exists visitor_vehicle_accesses_unit_id_idx
  on public.visitor_vehicle_accesses(unit_id);

create index if not exists visitor_vehicle_accesses_plate_idx
  on public.visitor_vehicle_accesses(plate);

create index if not exists visitor_vehicle_accesses_status_idx
  on public.visitor_vehicle_accesses(status);

create index if not exists visitor_vehicle_accesses_entry_validated_by_idx
  on public.visitor_vehicle_accesses(entry_validated_by);

create index if not exists visitor_vehicle_accesses_exit_validated_by_idx
  on public.visitor_vehicle_accesses(exit_validated_by);

create unique index if not exists visitor_vehicle_accesses_active_plate_unique_idx
  on public.visitor_vehicle_accesses(condominium_id, plate)
  where status = 'active';

drop policy if exists vehicle_plate_blacklist_select_accessible on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_manage_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_insert_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_update_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_delete_operators on public.vehicle_plate_blacklist;
drop policy if exists visitor_vehicle_accesses_select_accessible on public.visitor_vehicle_accesses;
drop policy if exists visitor_vehicle_accesses_insert_operators on public.visitor_vehicle_accesses;
drop policy if exists visitor_vehicle_accesses_update_operators on public.visitor_vehicle_accesses;

create policy vehicle_plate_blacklist_select_accessible
  on public.vehicle_plate_blacklist
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy vehicle_plate_blacklist_insert_operators
  on public.vehicle_plate_blacklist
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy vehicle_plate_blacklist_update_operators
  on public.vehicle_plate_blacklist
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy vehicle_plate_blacklist_delete_operators
  on public.vehicle_plate_blacklist
  for delete
  to authenticated
  using (public.can_operate_condominium(condominium_id));

create policy visitor_vehicle_accesses_select_accessible
  on public.visitor_vehicle_accesses
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy visitor_vehicle_accesses_insert_operators
  on public.visitor_vehicle_accesses
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy visitor_vehicle_accesses_update_operators
  on public.visitor_vehicle_accesses
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));
