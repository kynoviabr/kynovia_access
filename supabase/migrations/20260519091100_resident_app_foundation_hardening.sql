drop policy if exists resident_access_approvals_update_residents on public.resident_access_approvals;
drop policy if exists resident_access_approvals_update_operators on public.resident_access_approvals;
drop policy if exists resident_access_approvals_update_authorized on public.resident_access_approvals;

create policy resident_access_approvals_update_authorized
  on public.resident_access_approvals
  for update
  to authenticated
  using (
    public.can_operate_condominium(condominium_id)
    or (
      status = 'pending'
      and expires_at > now()
      and exists (
        select 1
        from public.residents r
        where r.id = resident_id
          and r.profile_id = (select auth.uid())
          and r.status = 'active'
      )
    )
  )
  with check (
    public.can_operate_condominium(condominium_id)
    or (
      status in ('approved', 'rejected')
      and exists (
        select 1
        from public.residents r
        where r.id = resident_id
          and r.profile_id = (select auth.uid())
          and r.status = 'active'
      )
    )
  );
