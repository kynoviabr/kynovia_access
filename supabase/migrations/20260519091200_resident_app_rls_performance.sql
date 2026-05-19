drop policy if exists resident_favorite_visitors_select_own on public.resident_favorite_visitors;
drop policy if exists resident_favorite_visitors_insert_own on public.resident_favorite_visitors;
drop policy if exists resident_favorite_visitors_update_own on public.resident_favorite_visitors;
drop policy if exists resident_access_approvals_select_accessible on public.resident_access_approvals;
drop policy if exists resident_access_approvals_update_authorized on public.resident_access_approvals;

create policy resident_favorite_visitors_select_own
  on public.resident_favorite_visitors
  for select
  to authenticated
  using (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_favorite_visitors_insert_own
  on public.resident_favorite_visitors
  for insert
  to authenticated
  with check (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_favorite_visitors_update_own
  on public.resident_favorite_visitors
  for update
  to authenticated
  using (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  )
  with check (
    public.has_condominium_access(condominium_id)
    and exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

create policy resident_access_approvals_select_accessible
  on public.resident_access_approvals
  for select
  to authenticated
  using (
    public.can_operate_condominium(condominium_id)
    or exists (
      select 1
      from public.residents r
      where r.id = resident_id
        and r.profile_id = (select auth.uid())
        and r.status = 'active'
    )
  );

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
