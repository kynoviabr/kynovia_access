create index if not exists access_invites_tenant_id_idx
  on public.access_invites(tenant_id);

create index if not exists access_invites_unit_id_idx
  on public.access_invites(unit_id);

create index if not exists access_invites_visitor_id_idx
  on public.access_invites(visitor_id);

create index if not exists access_invites_cancelled_by_idx
  on public.access_invites(cancelled_by);

create index if not exists access_invite_validations_validated_by_idx
  on public.access_invite_validations(validated_by);

revoke execute on function public.is_current_resident_for_unit(uuid, uuid, uuid) from public, anon, authenticated;

drop policy if exists access_invites_select_accessible on public.access_invites;
drop policy if exists access_invites_manage_operators on public.access_invites;
drop policy if exists access_invites_insert_residents on public.access_invites;
drop policy if exists access_invites_update_own_residents on public.access_invites;
drop policy if exists access_invites_insert_authorized on public.access_invites;
drop policy if exists access_invites_update_authorized on public.access_invites;
drop policy if exists access_invites_delete_operators on public.access_invites;

create policy access_invites_select_accessible
  on public.access_invites
  for select
  to authenticated
  using (public.has_condominium_access(condominium_id));

create policy access_invites_insert_authorized
  on public.access_invites
  for insert
  to authenticated
  with check (
    public.can_operate_condominium(condominium_id)
    or (
      tenant_id = public.current_tenant_id()
      and public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
    )
  );

create policy access_invites_update_authorized
  on public.access_invites
  for update
  to authenticated
  using (
    public.can_operate_condominium(condominium_id)
    or (
      tenant_id = public.current_tenant_id()
      and public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
    )
  )
  with check (
    public.can_operate_condominium(condominium_id)
    or (
      tenant_id = public.current_tenant_id()
      and public.is_current_resident_for_unit(resident_id, unit_id, condominium_id)
    )
  );

create policy access_invites_delete_operators
  on public.access_invites
  for delete
  to authenticated
  using (public.can_operate_condominium(condominium_id));
