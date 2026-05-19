create table if not exists public.operational_ai_analyses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  provider text not null default 'mock_ai' check (provider in ('mock_ai', 'openai_responses')),
  model text,
  event_source text not null check (event_source in ('access_event', 'gate_command', 'occurrence', 'lpr', 'facial', 'manual_note')),
  event_id uuid,
  category text not null check (category in ('normal_operation', 'visitor_exception', 'denied_access', 'hardware_failure', 'possible_fraud', 'security_risk')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  risk_score integer not null check (risk_score between 0 and 100),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  summary text not null,
  recommendations jsonb not null default '[]'::jsonb,
  signals jsonb not null default '[]'::jsonb,
  status text not null default 'completed' check (status in ('pending', 'completed', 'failed', 'dismissed')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.operational_ai_alerts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  analysis_id uuid references public.operational_ai_analyses(id) on delete set null,
  alert_type text not null check (alert_type in ('operator_attention', 'repeated_denials', 'capacity_pressure', 'possible_fraud', 'hardware_attention')),
  severity text not null default 'medium' check (severity in ('low', 'medium', 'high', 'critical')),
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved', 'dismissed')),
  assigned_to uuid references public.profiles(id) on delete set null,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doorman_assistant_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  operator_profile_id uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'closed')),
  title text,
  last_message_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.doorman_assistant_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  condominium_id uuid not null references public.condominiums(id) on delete cascade,
  session_id uuid not null references public.doorman_assistant_sessions(id) on delete cascade,
  role text not null check (role in ('operator', 'assistant', 'system')),
  content text not null,
  model text,
  safety_flags jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop trigger if exists operational_ai_analyses_set_updated_at on public.operational_ai_analyses;
create trigger operational_ai_analyses_set_updated_at
before update on public.operational_ai_analyses
for each row
execute function public.set_updated_at();

drop trigger if exists operational_ai_alerts_set_updated_at on public.operational_ai_alerts;
create trigger operational_ai_alerts_set_updated_at
before update on public.operational_ai_alerts
for each row
execute function public.set_updated_at();

drop trigger if exists doorman_assistant_sessions_set_updated_at on public.doorman_assistant_sessions;
create trigger doorman_assistant_sessions_set_updated_at
before update on public.doorman_assistant_sessions
for each row
execute function public.set_updated_at();

alter table public.operational_ai_analyses enable row level security;
alter table public.operational_ai_alerts enable row level security;
alter table public.doorman_assistant_sessions enable row level security;
alter table public.doorman_assistant_messages enable row level security;

grant select, insert, update on public.operational_ai_analyses to authenticated;
grant select, insert, update on public.operational_ai_alerts to authenticated;
grant select, insert, update on public.doorman_assistant_sessions to authenticated;
grant select, insert on public.doorman_assistant_messages to authenticated;

create index if not exists operational_ai_analyses_tenant_id_idx
  on public.operational_ai_analyses(tenant_id);
create index if not exists operational_ai_analyses_condominium_id_idx
  on public.operational_ai_analyses(condominium_id);
create index if not exists operational_ai_analyses_event_idx
  on public.operational_ai_analyses(event_source, event_id);
create index if not exists operational_ai_analyses_risk_idx
  on public.operational_ai_analyses(risk_level, risk_score);
create index if not exists operational_ai_analyses_created_at_idx
  on public.operational_ai_analyses(created_at);
create index if not exists operational_ai_analyses_reviewed_by_idx
  on public.operational_ai_analyses(reviewed_by);

create index if not exists operational_ai_alerts_tenant_id_idx
  on public.operational_ai_alerts(tenant_id);
create index if not exists operational_ai_alerts_condominium_id_idx
  on public.operational_ai_alerts(condominium_id);
create index if not exists operational_ai_alerts_analysis_id_idx
  on public.operational_ai_alerts(analysis_id);
create index if not exists operational_ai_alerts_status_idx
  on public.operational_ai_alerts(status);
create index if not exists operational_ai_alerts_severity_idx
  on public.operational_ai_alerts(severity);
create index if not exists operational_ai_alerts_assigned_to_idx
  on public.operational_ai_alerts(assigned_to);
create index if not exists operational_ai_alerts_acknowledged_by_idx
  on public.operational_ai_alerts(acknowledged_by);
create index if not exists operational_ai_alerts_resolved_by_idx
  on public.operational_ai_alerts(resolved_by);

create index if not exists doorman_assistant_sessions_tenant_id_idx
  on public.doorman_assistant_sessions(tenant_id);
create index if not exists doorman_assistant_sessions_condominium_id_idx
  on public.doorman_assistant_sessions(condominium_id);
create index if not exists doorman_assistant_sessions_operator_profile_id_idx
  on public.doorman_assistant_sessions(operator_profile_id);
create index if not exists doorman_assistant_sessions_status_idx
  on public.doorman_assistant_sessions(status);

create index if not exists doorman_assistant_messages_tenant_id_idx
  on public.doorman_assistant_messages(tenant_id);
create index if not exists doorman_assistant_messages_condominium_id_idx
  on public.doorman_assistant_messages(condominium_id);
create index if not exists doorman_assistant_messages_session_id_idx
  on public.doorman_assistant_messages(session_id);
create index if not exists doorman_assistant_messages_created_at_idx
  on public.doorman_assistant_messages(created_at);

drop policy if exists operational_ai_analyses_select_accessible on public.operational_ai_analyses;
drop policy if exists operational_ai_analyses_insert_operators on public.operational_ai_analyses;
drop policy if exists operational_ai_analyses_update_operators on public.operational_ai_analyses;
drop policy if exists operational_ai_alerts_select_accessible on public.operational_ai_alerts;
drop policy if exists operational_ai_alerts_insert_operators on public.operational_ai_alerts;
drop policy if exists operational_ai_alerts_update_operators on public.operational_ai_alerts;
drop policy if exists doorman_assistant_sessions_select_accessible on public.doorman_assistant_sessions;
drop policy if exists doorman_assistant_sessions_insert_operators on public.doorman_assistant_sessions;
drop policy if exists doorman_assistant_sessions_update_operators on public.doorman_assistant_sessions;
drop policy if exists doorman_assistant_messages_select_accessible on public.doorman_assistant_messages;
drop policy if exists doorman_assistant_messages_insert_operators on public.doorman_assistant_messages;

create policy operational_ai_analyses_select_accessible
  on public.operational_ai_analyses
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy operational_ai_analyses_insert_operators
  on public.operational_ai_analyses
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy operational_ai_analyses_update_operators
  on public.operational_ai_analyses
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy operational_ai_alerts_select_accessible
  on public.operational_ai_alerts
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy operational_ai_alerts_insert_operators
  on public.operational_ai_alerts
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy operational_ai_alerts_update_operators
  on public.operational_ai_alerts
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy doorman_assistant_sessions_select_accessible
  on public.doorman_assistant_sessions
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy doorman_assistant_sessions_insert_operators
  on public.doorman_assistant_sessions
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy doorman_assistant_sessions_update_operators
  on public.doorman_assistant_sessions
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy doorman_assistant_messages_select_accessible
  on public.doorman_assistant_messages
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy doorman_assistant_messages_insert_operators
  on public.doorman_assistant_messages
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));
