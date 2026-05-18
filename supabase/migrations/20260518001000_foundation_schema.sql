create extension if not exists "citext" with schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
$$;

create or replace function public.has_tenant_access(target_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and tenant_id = target_tenant_id
  )
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_role_check'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
      add constraint profiles_role_check
      check (role in ('platform_admin', 'tenant_admin', 'condominium_admin', 'gatehouse_operator', 'resident'));
  end if;
end;
$$;

create table if not exists public.condominium_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('condominium_admin', 'gatehouse_operator', 'resident')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condominium_id, profile_id)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  block text,
  number text not null,
  floor text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condominium_id, block, number)
);

create table if not exists public.residents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  full_name text not null,
  document text,
  phone text,
  email extensions.citext,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resident_units (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  resident_id uuid not null references public.residents(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  relationship text not null default 'resident',
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (resident_id, unit_id)
);

create table if not exists public.resident_vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  resident_id uuid not null references public.residents(id) on delete cascade,
  plate text not null,
  label text,
  status text not null default 'active' check (status in ('active', 'inactive', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (condominium_id, plate)
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  full_name text not null,
  document text,
  phone text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.visitor_vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  plate text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (visitor_id, plate)
);

create table if not exists public.access_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  unit_id uuid references public.units(id) on delete set null,
  resident_id uuid references public.residents(id) on delete set null,
  visitor_id uuid references public.visitors(id) on delete set null,
  visitor_name text not null,
  visitor_phone text,
  plate text,
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  max_uses integer not null default 1 check (max_uses > 0),
  use_count integer not null default 0 check (use_count >= 0),
  status text not null default 'active' check (status in ('active', 'cancelled', 'expired', 'used')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at),
  check (use_count <= max_uses)
);

create table if not exists public.access_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  access_point_id uuid references public.access_points(id) on delete set null,
  invite_id uuid references public.access_invites(id) on delete set null,
  resident_id uuid references public.residents(id) on delete set null,
  visitor_id uuid references public.visitors(id) on delete set null,
  plate text,
  direction text not null check (direction in ('entry', 'exit')),
  decision text not null check (decision in ('allow', 'deny', 'manual_review')),
  reason text,
  decided_by uuid references public.profiles(id) on delete set null,
  decided_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.gate_commands (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  access_point_id uuid not null references public.access_points(id) on delete cascade,
  access_event_id uuid references public.access_events(id) on delete set null,
  command text not null check (command in ('open', 'close', 'hold_open', 'lock')),
  provider text not null default 'mock',
  status text not null default 'pending' check (status in ('pending', 'sent', 'confirmed', 'failed', 'cancelled')),
  requested_by uuid references public.profiles(id) on delete set null,
  requested_at timestamptz not null default now(),
  executed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  condominium_id uuid references public.condominiums(id) on delete set null,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_table text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

create trigger audit_logs_prevent_update
before update on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

create trigger audit_logs_prevent_delete
before delete on public.audit_logs
for each row execute function public.prevent_audit_log_mutation();

create unique index if not exists access_points_unique_name_idx
  on public.access_points(tenant_id, condominium_id, name);

create index if not exists condominium_memberships_tenant_id_idx on public.condominium_memberships(tenant_id);
create index if not exists condominium_memberships_condominium_id_idx on public.condominium_memberships(condominium_id);
create index if not exists condominium_memberships_profile_id_idx on public.condominium_memberships(profile_id);
create index if not exists units_tenant_id_idx on public.units(tenant_id);
create index if not exists units_condominium_id_idx on public.units(condominium_id);
create index if not exists residents_tenant_id_idx on public.residents(tenant_id);
create index if not exists residents_condominium_id_idx on public.residents(condominium_id);
create index if not exists resident_units_unit_id_idx on public.resident_units(unit_id);
create index if not exists resident_units_resident_id_idx on public.resident_units(resident_id);
create index if not exists resident_vehicles_plate_idx on public.resident_vehicles(plate);
create index if not exists visitors_condominium_id_idx on public.visitors(condominium_id);
create index if not exists visitor_vehicles_plate_idx on public.visitor_vehicles(plate);
create index if not exists access_invites_condominium_id_idx on public.access_invites(condominium_id);
create index if not exists access_invites_plate_idx on public.access_invites(plate);
create index if not exists access_invites_expires_at_idx on public.access_invites(expires_at);
create index if not exists access_events_condominium_id_idx on public.access_events(condominium_id);
create index if not exists access_events_decided_at_idx on public.access_events(decided_at);
create index if not exists access_events_plate_idx on public.access_events(plate);
create index if not exists gate_commands_condominium_id_idx on public.gate_commands(condominium_id);
create index if not exists gate_commands_status_idx on public.gate_commands(status);
create index if not exists audit_logs_tenant_id_idx on public.audit_logs(tenant_id);
create index if not exists audit_logs_condominium_id_idx on public.audit_logs(condominium_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at);

create trigger condominium_memberships_set_updated_at
before update on public.condominium_memberships
for each row execute function public.set_updated_at();

create trigger units_set_updated_at
before update on public.units
for each row execute function public.set_updated_at();

create trigger residents_set_updated_at
before update on public.residents
for each row execute function public.set_updated_at();

create trigger resident_units_set_updated_at
before update on public.resident_units
for each row execute function public.set_updated_at();

create trigger resident_vehicles_set_updated_at
before update on public.resident_vehicles
for each row execute function public.set_updated_at();

create trigger visitors_set_updated_at
before update on public.visitors
for each row execute function public.set_updated_at();

create trigger visitor_vehicles_set_updated_at
before update on public.visitor_vehicles
for each row execute function public.set_updated_at();

create trigger access_invites_set_updated_at
before update on public.access_invites
for each row execute function public.set_updated_at();

create trigger gate_commands_set_updated_at
before update on public.gate_commands
for each row execute function public.set_updated_at();

alter table public.condominium_memberships enable row level security;
alter table public.units enable row level security;
alter table public.residents enable row level security;
alter table public.resident_units enable row level security;
alter table public.resident_vehicles enable row level security;
alter table public.visitors enable row level security;
alter table public.visitor_vehicles enable row level security;
alter table public.access_invites enable row level security;
alter table public.access_events enable row level security;
alter table public.gate_commands enable row level security;
alter table public.audit_logs enable row level security;

create or replace function public.has_condominium_access(target_condominium_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.condominiums c
    join public.profiles p on p.tenant_id = c.tenant_id
    where p.id = auth.uid()
      and c.id = target_condominium_id
      and (
        p.role in ('platform_admin', 'tenant_admin')
        or exists (
          select 1
          from public.condominium_memberships cm
          where cm.profile_id = p.id
            and cm.condominium_id = c.id
        )
      )
  )
$$;

create or replace function public.can_operate_condominium(target_condominium_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.condominiums c
    join public.profiles p on p.tenant_id = c.tenant_id
    where p.id = auth.uid()
      and c.id = target_condominium_id
      and (
        p.role in ('platform_admin', 'tenant_admin')
        or exists (
          select 1
          from public.condominium_memberships cm
          where cm.profile_id = p.id
            and cm.condominium_id = c.id
            and cm.role in ('condominium_admin', 'gatehouse_operator')
        )
      )
  )
$$;

create policy tenants_select_own
  on public.tenants
  for select
  to authenticated
  using (public.has_tenant_access(id));

create policy condominiums_select_accessible
  on public.condominiums
  for select
  to authenticated
  using (public.has_condominium_access(id));

create policy profiles_select_same_tenant
  on public.profiles
  for select
  to authenticated
  using (public.has_tenant_access(tenant_id));

create policy access_points_select_accessible
  on public.access_points
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy access_points_manage_admins
  on public.access_points
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy condominium_memberships_select_accessible
  on public.condominium_memberships
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy condominium_memberships_manage_admins
  on public.condominium_memberships
  for all
  to authenticated
  using (public.current_profile_role() in ('platform_admin', 'tenant_admin'))
  with check (public.current_profile_role() in ('platform_admin', 'tenant_admin'));

create policy units_select_accessible
  on public.units
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy units_manage_operators
  on public.units
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy residents_select_accessible
  on public.residents
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy residents_manage_operators
  on public.residents
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy resident_units_select_accessible
  on public.resident_units
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy resident_units_manage_operators
  on public.resident_units
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy resident_vehicles_select_accessible
  on public.resident_vehicles
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy resident_vehicles_manage_operators
  on public.resident_vehicles
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy visitors_select_accessible
  on public.visitors
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy visitors_manage_operators
  on public.visitors
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy visitor_vehicles_select_accessible
  on public.visitor_vehicles
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy visitor_vehicles_manage_operators
  on public.visitor_vehicles
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy access_invites_select_accessible
  on public.access_invites
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy access_invites_manage_operators
  on public.access_invites
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy access_events_select_accessible
  on public.access_events
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy access_events_insert_operators
  on public.access_events
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy gate_commands_select_accessible
  on public.gate_commands
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy gate_commands_manage_operators
  on public.gate_commands
  for all
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy audit_logs_select_same_tenant
  on public.audit_logs
  for select
  to authenticated
  using (
    tenant_id is null
    or public.has_tenant_access(tenant_id)
  );

create policy audit_logs_insert_operators
  on public.audit_logs
  for insert
  to authenticated
  with check (
    tenant_id is null
    or public.has_tenant_access(tenant_id)
  );
