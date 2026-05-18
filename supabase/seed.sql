insert into public.tenants (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Kynovia Demo', 'kynovia-demo')
on conflict (slug) do update
set name = excluded.name;

insert into public.condominiums (id, tenant_id, name, slug, timezone)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Condominio Demo',
  'condominio-demo',
  'America/Sao_Paulo'
)
on conflict (tenant_id, slug) do update
set name = excluded.name,
    timezone = excluded.timezone;

insert into public.access_points (id, tenant_id, condominium_id, name, kind)
values (
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'Portaria Principal',
  'gatehouse'
)
on conflict (tenant_id, condominium_id, name) do update
set kind = excluded.kind;

insert into public.units (id, tenant_id, condominium_id, block, number, floor)
values (
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'A',
  '101',
  '1'
)
on conflict (condominium_id, block, number) do update
set floor = excluded.floor;

insert into public.residents (id, tenant_id, condominium_id, full_name, document, phone, email, status)
values (
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'Morador Demo',
  '00000000000',
  '+5511999990000',
  'morador.demo@kynovia.local',
  'active'
)
on conflict (id) do update
set full_name = excluded.full_name,
    phone = excluded.phone,
    email = excluded.email,
    status = excluded.status;

insert into public.resident_units (tenant_id, condominium_id, resident_id, unit_id, relationship, is_primary)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000301',
  'owner',
  true
)
on conflict (resident_id, unit_id) do update
set relationship = excluded.relationship,
    is_primary = excluded.is_primary;

insert into public.resident_vehicles (id, tenant_id, condominium_id, resident_id, plate, label, status)
values (
  '00000000-0000-0000-0000-000000000501',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000401',
  'ABC1D23',
  'Carro principal',
  'active'
)
on conflict (condominium_id, plate) do update
set label = excluded.label,
    status = excluded.status;

insert into public.visitors (id, tenant_id, condominium_id, full_name, document, phone, notes)
values (
  '00000000-0000-0000-0000-000000000601',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'Visitante Demo',
  '11111111111',
  '+5511988880000',
  'Registro de desenvolvimento'
)
on conflict (id) do update
set full_name = excluded.full_name,
    phone = excluded.phone,
    notes = excluded.notes;

insert into public.visitor_vehicles (tenant_id, condominium_id, visitor_id, plate)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000601',
  'XYZ9A87'
)
on conflict (visitor_id, plate) do nothing;

insert into public.access_invites (
  id,
  tenant_id,
  condominium_id,
  unit_id,
  resident_id,
  visitor_id,
  visitor_name,
  visitor_phone,
  plate,
  starts_at,
  expires_at,
  max_uses,
  status
)
values (
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000301',
  '00000000-0000-0000-0000-000000000401',
  '00000000-0000-0000-0000-000000000601',
  'Visitante Demo',
  '+5511988880000',
  'XYZ9A87',
  now(),
  now() + interval '1 day',
  1,
  'active'
)
on conflict (id) do update
set visitor_name = excluded.visitor_name,
    visitor_phone = excluded.visitor_phone,
    plate = excluded.plate,
    expires_at = excluded.expires_at,
    status = excluded.status;

insert into public.access_events (
  id,
  tenant_id,
  condominium_id,
  access_point_id,
  invite_id,
  visitor_id,
  plate,
  direction,
  decision,
  reason
)
values (
  '00000000-0000-0000-0000-000000000801',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000701',
  '00000000-0000-0000-0000-000000000601',
  'XYZ9A87',
  'entry',
  'allow',
  'Seed DEV'
)
on conflict (id) do nothing;

insert into public.gate_commands (
  id,
  tenant_id,
  condominium_id,
  access_point_id,
  access_event_id,
  command,
  provider,
  status
)
values (
  '00000000-0000-0000-0000-000000000901',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000201',
  '00000000-0000-0000-0000-000000000801',
  'open',
  'mock',
  'confirmed'
)
on conflict (id) do update
set status = excluded.status;

insert into public.audit_logs (
  id,
  tenant_id,
  condominium_id,
  action,
  entity_table,
  entity_id,
  metadata
)
values (
  '00000000-0000-0000-0000-000000001001',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'seed.created',
  'seed',
  null,
  '{"environment":"development"}'::jsonb
)
on conflict (id) do nothing;
