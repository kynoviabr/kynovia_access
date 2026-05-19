alter table public.residents
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

alter table public.access_invites
  add column if not exists invite_type text not null default 'single',
  add column if not exists recurrence_rule text,
  add column if not exists qr_token_hash text,
  add column if not exists qr_token_expires_at timestamptz,
  add column if not exists cancelled_by uuid references public.profiles(id) on delete set null,
  add column if not exists cancelled_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_invites_invite_type_check'
      and conrelid = 'public.access_invites'::regclass
  ) then
    alter table public.access_invites
      add constraint access_invites_invite_type_check
      check (invite_type in ('single', 'recurring'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'access_invites_qr_token_window_check'
      and conrelid = 'public.access_invites'::regclass
  ) then
    alter table public.access_invites
      add constraint access_invites_qr_token_window_check
      check (qr_token_expires_at is null or qr_token_expires_at <= expires_at);
  end if;
end;
$$;

create unique index if not exists residents_profile_id_unique_idx
  on public.residents(profile_id)
  where profile_id is not null;

create index if not exists residents_profile_id_idx
  on public.residents(profile_id);

create unique index if not exists access_invites_qr_token_hash_unique_idx
  on public.access_invites(qr_token_hash)
  where qr_token_hash is not null;

create index if not exists access_invites_resident_id_idx
  on public.access_invites(resident_id);

create index if not exists access_invites_status_idx
  on public.access_invites(status);

create index if not exists access_invites_invite_type_idx
  on public.access_invites(invite_type);

create table if not exists public.access_invite_validations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  invite_id uuid references public.access_invites(id) on delete set null,
  validated_by uuid references public.profiles(id) on delete set null,
  result text not null check (
    result in (
      'allowed',
      'denied',
      'expired',
      'cancelled',
      'not_started',
      'usage_limit_reached',
      'invalid'
    )
  ),
  reason text,
  created_at timestamptz not null default now()
);

alter table public.access_invite_validations enable row level security;

grant select, insert on public.access_invite_validations to authenticated;

create index if not exists access_invite_validations_tenant_id_idx
  on public.access_invite_validations(tenant_id);

create index if not exists access_invite_validations_condominium_id_idx
  on public.access_invite_validations(condominium_id);

create index if not exists access_invite_validations_invite_id_idx
  on public.access_invite_validations(invite_id);

create index if not exists access_invite_validations_created_at_idx
  on public.access_invite_validations(created_at);

create or replace function public.is_current_resident_for_unit(
  target_resident_id uuid,
  target_unit_id uuid,
  target_condominium_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.residents r
    join public.resident_units ru on ru.resident_id = r.id
    where r.id = target_resident_id
      and r.profile_id = auth.uid()
      and r.status = 'active'
      and ru.unit_id = target_unit_id
      and ru.condominium_id = target_condominium_id
  )
$$;

drop policy if exists access_invites_insert_residents on public.access_invites;
drop policy if exists access_invites_update_own_residents on public.access_invites;
drop policy if exists access_invite_validations_select_accessible on public.access_invite_validations;
drop policy if exists access_invite_validations_insert_operators on public.access_invite_validations;

create policy access_invites_insert_residents
  on public.access_invites
  for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and
    public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
  );

create policy access_invites_update_own_residents
  on public.access_invites
  for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and
    public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
  )
  with check (
    tenant_id = public.current_tenant_id()
    and
    public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
  );

create policy access_invite_validations_select_accessible
  on public.access_invite_validations
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy access_invite_validations_insert_operators
  on public.access_invite_validations
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));
