alter table public.audit_logs
  add column if not exists actor_user_id uuid,
  add column if not exists event_type text not null default 'operational_event',
  add column if not exists source text not null default 'application',
  add column if not exists severity text not null default 'info',
  add column if not exists occurred_at timestamptz not null default now(),
  add column if not exists correlation_id text,
  add column if not exists retention_policy text not null default 'operational',
  add column if not exists retention_until date,
  add column if not exists redaction_status text not null default 'none',
  add column if not exists before_state jsonb,
  add column if not exists after_state jsonb;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_event_type_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_event_type_check
      check (
        event_type in (
          'operational_event',
          'physical_command',
          'permission_change',
          'data_export',
          'security_event',
          'system_event'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_source_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_source_check
      check (source in ('application', 'database_trigger', 'edge_function', 'integration', 'operator', 'system'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_severity_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_severity_check
      check (severity in ('debug', 'info', 'warning', 'critical'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_retention_policy_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_retention_policy_check
      check (retention_policy in ('operational', 'security', 'legal_hold', 'lgpd_request'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'audit_logs_redaction_status_check'
      and conrelid = 'public.audit_logs'::regclass
  ) then
    alter table public.audit_logs
      add constraint audit_logs_redaction_status_check
      check (redaction_status in ('none', 'pending', 'redacted'));
  end if;
end;
$$;

create table if not exists public.audit_retention_policies (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid references public.condominiums(id) on delete cascade,
  event_type text not null,
  retention_days integer not null check (retention_days > 0),
  legal_basis text not null default 'legitimate_interest',
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, condominium_id, event_type)
);

create table if not exists public.audit_log_export_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid references public.condominiums(id) on delete set null,
  requested_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed', 'expired')),
  format text not null default 'csv' check (format in ('csv', 'json')),
  filters jsonb not null default '{}'::jsonb,
  file_path text,
  exported_at timestamptz,
  expires_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists audit_retention_policies_set_updated_at on public.audit_retention_policies;
create trigger audit_retention_policies_set_updated_at
before update on public.audit_retention_policies
for each row
execute function public.set_updated_at();

drop trigger if exists audit_log_export_requests_set_updated_at on public.audit_log_export_requests;
create trigger audit_log_export_requests_set_updated_at
before update on public.audit_log_export_requests
for each row
execute function public.set_updated_at();

alter table public.audit_retention_policies enable row level security;
alter table public.audit_log_export_requests enable row level security;

grant select, insert, update on public.audit_retention_policies to authenticated;
grant select, insert, update on public.audit_log_export_requests to authenticated;
grant select on public.audit_logs to authenticated;

create index if not exists audit_logs_event_type_idx on public.audit_logs(event_type);
create index if not exists audit_logs_source_idx on public.audit_logs(source);
create index if not exists audit_logs_severity_idx on public.audit_logs(severity);
create index if not exists audit_logs_occurred_at_idx on public.audit_logs(occurred_at);
create index if not exists audit_logs_actor_user_id_idx on public.audit_logs(actor_user_id);
create index if not exists audit_logs_actor_profile_id_idx on public.audit_logs(actor_profile_id);
create index if not exists audit_logs_correlation_id_idx on public.audit_logs(correlation_id);
create index if not exists audit_logs_retention_until_idx on public.audit_logs(retention_until);
create index if not exists audit_retention_policies_tenant_id_idx on public.audit_retention_policies(tenant_id);
create index if not exists audit_retention_policies_condominium_id_idx on public.audit_retention_policies(condominium_id);
create index if not exists audit_retention_policies_created_by_idx on public.audit_retention_policies(created_by);
create index if not exists audit_log_export_requests_tenant_id_idx on public.audit_log_export_requests(tenant_id);
create index if not exists audit_log_export_requests_condominium_id_idx on public.audit_log_export_requests(condominium_id);
create index if not exists audit_log_export_requests_requested_by_idx on public.audit_log_export_requests(requested_by);
create index if not exists audit_log_export_requests_status_idx on public.audit_log_export_requests(status);

drop policy if exists audit_retention_policies_select_same_tenant on public.audit_retention_policies;
drop policy if exists audit_retention_policies_manage_tenant_admins on public.audit_retention_policies;
drop policy if exists audit_log_export_requests_select_same_tenant on public.audit_log_export_requests;
drop policy if exists audit_log_export_requests_create_same_tenant on public.audit_log_export_requests;
drop policy if exists audit_log_export_requests_update_tenant_admins on public.audit_log_export_requests;

create policy audit_retention_policies_select_same_tenant
  on public.audit_retention_policies
  for select
  to authenticated
  using (public.has_tenant_access(tenant_id));

create policy audit_retention_policies_manage_tenant_admins
  on public.audit_retention_policies
  for all
  to authenticated
  using (
    public.has_tenant_access(tenant_id)
    and public.current_profile_role() in ('platform_admin', 'tenant_admin')
  )
  with check (
    public.has_tenant_access(tenant_id)
    and public.current_profile_role() in ('platform_admin', 'tenant_admin')
  );

create policy audit_log_export_requests_select_same_tenant
  on public.audit_log_export_requests
  for select
  to authenticated
  using (public.has_tenant_access(tenant_id));

create policy audit_log_export_requests_create_same_tenant
  on public.audit_log_export_requests
  for insert
  to authenticated
  with check (
    public.has_tenant_access(tenant_id)
    and requested_by = auth.uid()
  );

create policy audit_log_export_requests_update_tenant_admins
  on public.audit_log_export_requests
  for update
  to authenticated
  using (
    public.has_tenant_access(tenant_id)
    and public.current_profile_role() in ('platform_admin', 'tenant_admin')
  )
  with check (
    public.has_tenant_access(tenant_id)
    and public.current_profile_role() in ('platform_admin', 'tenant_admin')
  );

create or replace view public.audit_log_export_view
with (security_invoker = true)
as
select
  id,
  tenant_id,
  condominium_id,
  actor_profile_id,
  actor_user_id,
  event_type,
  action,
  entity_table,
  entity_id,
  source,
  severity,
  occurred_at,
  correlation_id,
  retention_policy,
  retention_until,
  redaction_status,
  metadata,
  created_at
from public.audit_logs;

grant select on public.audit_log_export_view to authenticated;

create or replace function public.audit_gate_command_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  command_row public.gate_commands%rowtype;
  actor_id uuid;
begin
  if tg_op = 'DELETE' then
    command_row := old;
  else
    command_row := new;
  end if;

  actor_id := coalesce(command_row.requested_by, auth.uid());

  insert into public.audit_logs (
    tenant_id,
    condominium_id,
    actor_profile_id,
    actor_user_id,
    action,
    entity_table,
    entity_id,
    event_type,
    source,
    severity,
    occurred_at,
    correlation_id,
    before_state,
    after_state,
    metadata
  )
  values (
    command_row.tenant_id,
    command_row.condominium_id,
    actor_id,
    auth.uid(),
    'gate_command.' || lower(tg_op),
    'gate_commands',
    command_row.id,
    'physical_command',
    'database_trigger',
    case when command_row.status = 'failed' then 'warning' else 'info' end,
    now(),
    command_row.access_event_id::text,
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    jsonb_build_object(
      'command', command_row.command,
      'status', command_row.status,
      'provider', command_row.provider,
      'access_point_id', command_row.access_point_id,
      'access_event_id', command_row.access_event_id,
      'requested_at', command_row.requested_at,
      'executed_at', command_row.executed_at
    )
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

create or replace function public.audit_permission_changes()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  target_tenant_id uuid;
  target_condominium_id uuid;
  target_entity_id uuid;
  target_table_name text;
  action_name text;
  metadata_payload jsonb;
begin
  if tg_table_name = 'profiles' then
    if tg_op = 'UPDATE'
      and old.role is not distinct from new.role
      and old.tenant_id is not distinct from new.tenant_id
    then
      return new;
    end if;

    target_tenant_id := case when tg_op = 'DELETE' then old.tenant_id else new.tenant_id end;
    target_condominium_id := null;
    target_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_table_name := 'profiles';
    action_name := 'permission.profile_' || lower(tg_op);
    metadata_payload := jsonb_build_object(
      'old_role', case when tg_op in ('UPDATE', 'DELETE') then old.role else null end,
      'new_role', case when tg_op in ('INSERT', 'UPDATE') then new.role else null end
    );
  elsif tg_table_name = 'condominium_memberships' then
    if tg_op = 'UPDATE'
      and old.role is not distinct from new.role
      and old.profile_id is not distinct from new.profile_id
      and old.condominium_id is not distinct from new.condominium_id
    then
      return new;
    end if;

    target_tenant_id := case when tg_op = 'DELETE' then old.tenant_id else new.tenant_id end;
    target_condominium_id := case when tg_op = 'DELETE' then old.condominium_id else new.condominium_id end;
    target_entity_id := case when tg_op = 'DELETE' then old.id else new.id end;
    target_table_name := 'condominium_memberships';
    action_name := 'permission.membership_' || lower(tg_op);
    metadata_payload := jsonb_build_object(
      'profile_id', case when tg_op = 'DELETE' then old.profile_id else new.profile_id end,
      'old_role', case when tg_op in ('UPDATE', 'DELETE') then old.role else null end,
      'new_role', case when tg_op in ('INSERT', 'UPDATE') then new.role else null end
    );
  else
    return null;
  end if;

  insert into public.audit_logs (
    tenant_id,
    condominium_id,
    actor_profile_id,
    actor_user_id,
    action,
    entity_table,
    entity_id,
    event_type,
    source,
    severity,
    occurred_at,
    before_state,
    after_state,
    metadata
  )
  values (
    target_tenant_id,
    target_condominium_id,
    auth.uid(),
    auth.uid(),
    action_name,
    target_table_name,
    target_entity_id,
    'permission_change',
    'database_trigger',
    'warning',
    now(),
    case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    metadata_payload
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

drop trigger if exists audit_gate_command_changes on public.gate_commands;
create trigger audit_gate_command_changes
after insert or update or delete on public.gate_commands
for each row
execute function public.audit_gate_command_changes();

drop trigger if exists audit_profile_permission_changes on public.profiles;
create trigger audit_profile_permission_changes
after insert or update or delete on public.profiles
for each row
execute function public.audit_permission_changes();

drop trigger if exists audit_membership_permission_changes on public.condominium_memberships;
create trigger audit_membership_permission_changes
after insert or update or delete on public.condominium_memberships
for each row
execute function public.audit_permission_changes();

comment on table public.audit_logs is 'Immutable audit log for operational, physical command, permission, export, and security events.';
comment on table public.audit_retention_policies is 'Tenant-scoped retention policy catalog for audit and compliance records.';
comment on table public.audit_log_export_requests is 'Tenant-scoped audit log export workflow requests.';
