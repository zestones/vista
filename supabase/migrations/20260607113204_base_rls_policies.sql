-- Base RLS policies (#14). Source: vault "Backend (Supabase)/RLS & politiques d'acc.md".
-- RLS is already enabled deny-all (#11/#64); this GRANTS scoped access.
-- Projection tables (repos/milestones/issues/installations/sync_state) stay deny-all here;
-- their allowlist read policies land in Phase 4. service_role bypasses RLS for the Phase 3 sync.

-- ─── Helper functions ─────────────────────────────────────────────
-- SECURITY DEFINER is load-bearing: it lets policies read project_members/projects WITHOUT
-- re-triggering RLS, which avoids infinite policy recursion. search_path='' -> schema-qualify all.
create function public.is_active_member(p uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p and m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create function public.has_role(p uuid, min_role public.member_role) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p and m.user_id = auth.uid() and m.status = 'active'
      and (
        m.role = 'owner'
        or (min_role = 'editor' and m.role in ('owner', 'editor'))
        or (min_role = 'viewer' and m.role in ('owner', 'editor', 'viewer'))
      )
  );
$$;

create function public.is_owner(p uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.projects where id = p and owner_id = auth.uid());
$$;

-- ─── projects ─────────────────────────────────────────────────────
create policy projects_read on public.projects for select
  using (public.is_owner(id) or public.is_active_member(id));
create policy projects_write on public.projects for all
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ─── project_members ─────────────────────────────────────────────
create policy members_read on public.project_members for select
  using (public.is_owner(project_id) or user_id = auth.uid());
create policy members_manage on public.project_members for all
  using (public.is_owner(project_id)) with check (public.is_owner(project_id));

-- ─── project_invites (resolution via the SECURITY DEFINER RPC in #16, not direct select) ──
create policy invites_manage on public.project_invites for all
  using (public.is_owner(project_id)) with check (public.is_owner(project_id));

-- ─── submissions ─────────────────────────────────────────────────
create policy submissions_insert on public.submissions for insert
  with check (public.has_role(project_id, 'editor'));
create policy submissions_read on public.submissions for select
  using (public.is_owner(project_id) or submitted_by = auth.uid());
create policy submissions_update on public.submissions for update
  using (public.is_owner(project_id)) with check (public.is_owner(project_id));

-- ─── profiles (read own; managed by the handle_new_user trigger) ──
create policy profiles_read_self on public.profiles for select
  using (id = auth.uid());
