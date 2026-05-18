create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.prevent_audit_log_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'audit_logs are immutable';
end;
$$;

revoke execute on function public.current_tenant_id() from public;
revoke execute on function public.current_tenant_id() from anon;
revoke execute on function public.current_tenant_id() from authenticated;

revoke execute on function public.current_profile_role() from public;
revoke execute on function public.current_profile_role() from anon;
revoke execute on function public.current_profile_role() from authenticated;

revoke execute on function public.has_tenant_access(uuid) from public;
revoke execute on function public.has_tenant_access(uuid) from anon;
revoke execute on function public.has_tenant_access(uuid) from authenticated;

revoke execute on function public.has_condominium_access(uuid) from public;
revoke execute on function public.has_condominium_access(uuid) from anon;
revoke execute on function public.has_condominium_access(uuid) from authenticated;

revoke execute on function public.can_operate_condominium(uuid) from public;
revoke execute on function public.can_operate_condominium(uuid) from anon;
revoke execute on function public.can_operate_condominium(uuid) from authenticated;
