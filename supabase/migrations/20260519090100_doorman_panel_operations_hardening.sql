create index if not exists access_events_tenant_id_idx
  on public.access_events(tenant_id);

create index if not exists access_events_access_point_id_idx
  on public.access_events(access_point_id);

create index if not exists access_events_invite_id_idx
  on public.access_events(invite_id);

create index if not exists access_events_resident_id_idx
  on public.access_events(resident_id);

create index if not exists access_events_visitor_id_idx
  on public.access_events(visitor_id);

create index if not exists access_events_decided_by_idx
  on public.access_events(decided_by);

create index if not exists gate_commands_tenant_id_idx
  on public.gate_commands(tenant_id);

create index if not exists gate_commands_access_point_id_idx
  on public.gate_commands(access_point_id);

create index if not exists gate_commands_access_event_id_idx
  on public.gate_commands(access_event_id);

create index if not exists gate_commands_requested_by_idx
  on public.gate_commands(requested_by);

create index if not exists gatehouse_occurrences_resolved_by_idx
  on public.gatehouse_occurrences(resolved_by);

drop policy if exists gate_commands_manage_operators on public.gate_commands;
drop policy if exists gate_commands_insert_operators on public.gate_commands;
drop policy if exists gate_commands_update_operators on public.gate_commands;
drop policy if exists gate_commands_delete_operators on public.gate_commands;

create policy gate_commands_insert_operators
  on public.gate_commands
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy gate_commands_update_operators
  on public.gate_commands
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy gate_commands_delete_operators
  on public.gate_commands
  for delete
  to authenticated
  using (public.can_operate_condominium(condominium_id));
