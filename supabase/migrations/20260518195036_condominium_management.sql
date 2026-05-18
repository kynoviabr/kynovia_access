alter table public.condominiums
  add column if not exists settings jsonb not null default '{}'::jsonb,
  add column if not exists operational_rules jsonb not null default '{}'::jsonb,
  add column if not exists visitor_parking_capacity integer not null default 0,
  add column if not exists metadata jsonb not null default '{}'::jsonb;

alter table public.condominiums
  add constraint condominiums_visitor_parking_capacity_check
  check (visitor_parking_capacity >= 0);

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'condominiums'
      and policyname = 'condominiums_manage_tenant_admins'
  ) then
    create policy condominiums_manage_tenant_admins
      on public.condominiums
      for all
      to authenticated
      using (
        public.current_profile_role() in ('platform_admin', 'tenant_admin')
        and public.has_tenant_access(tenant_id)
      )
      with check (
        public.current_profile_role() in ('platform_admin', 'tenant_admin')
        and public.has_tenant_access(tenant_id)
      );
  end if;
end;
$$;

create index if not exists condominiums_name_idx on public.condominiums using btree (name);
create index if not exists units_number_idx on public.units using btree (number);
