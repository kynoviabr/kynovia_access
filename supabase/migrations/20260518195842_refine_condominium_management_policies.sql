drop policy if exists condominiums_manage_tenant_admins on public.condominiums;

create policy condominiums_insert_tenant_admins
  on public.condominiums
  for insert
  to authenticated
  with check (
    public.current_profile_role() in ('platform_admin', 'tenant_admin')
    and public.has_tenant_access(tenant_id)
  );

create policy condominiums_update_tenant_admins
  on public.condominiums
  for update
  to authenticated
  using (
    public.current_profile_role() in ('platform_admin', 'tenant_admin')
    and public.has_tenant_access(tenant_id)
  )
  with check (
    public.current_profile_role() in ('platform_admin', 'tenant_admin')
    and public.has_tenant_access(tenant_id)
  );

create policy condominiums_delete_tenant_admins
  on public.condominiums
  for delete
  to authenticated
  using (
    public.current_profile_role() in ('platform_admin', 'tenant_admin')
    and public.has_tenant_access(tenant_id)
  );

drop index if exists public.condominiums_name_idx;
drop index if exists public.units_number_idx;
