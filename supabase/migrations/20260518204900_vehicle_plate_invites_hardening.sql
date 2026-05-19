drop policy if exists vehicle_plate_blacklist_manage_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_insert_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_update_operators on public.vehicle_plate_blacklist;
drop policy if exists vehicle_plate_blacklist_delete_operators on public.vehicle_plate_blacklist;

create policy vehicle_plate_blacklist_insert_operators
  on public.vehicle_plate_blacklist
  for insert
  to authenticated
  with check (public.can_operate_condominium(condominium_id));

create policy vehicle_plate_blacklist_update_operators
  on public.vehicle_plate_blacklist
  for update
  to authenticated
  using (public.can_operate_condominium(condominium_id))
  with check (public.can_operate_condominium(condominium_id));

create policy vehicle_plate_blacklist_delete_operators
  on public.vehicle_plate_blacklist
  for delete
  to authenticated
  using (public.can_operate_condominium(condominium_id));
