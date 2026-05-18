insert into public.tenants (id, name, slug)
values ('00000000-0000-0000-0000-000000000001', 'Kynovia Demo', 'kynovia-demo')
on conflict (slug) do nothing;

insert into public.condominiums (id, tenant_id, name, slug)
values (
  '00000000-0000-0000-0000-000000000101',
  '00000000-0000-0000-0000-000000000001',
  'Condominio Demo',
  'condominio-demo'
)
on conflict (tenant_id, slug) do nothing;

insert into public.access_points (tenant_id, condominium_id, name, kind)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000101',
  'Portaria Principal',
  'gatehouse'
);
