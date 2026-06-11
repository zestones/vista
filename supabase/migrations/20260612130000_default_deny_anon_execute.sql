-- Security S4 (#185): close the two anon-reachable definer RPCs that are meaningless without a
-- session, and harden them with explicit auth.uid() guards (defense-in-depth).
--
-- Scope notes (both verified live against the local DB):
--   * NOT the audit's blanket "revoke execute on ALL functions ... from authenticated": that breaks
--     the app — is_owner() and six sibling helpers are called inside RLS policies, so the querying
--     role needs EXECUTE on them; revoking it yields "permission denied for function is_owner" on
--     every read. Those helpers are safe boolean checks about auth.uid() and are left untouched.
--   * The issue's "durable default-deny" step (alter default privileges) is intentionally omitted:
--     new functions are auto-granted to anon by the *supabase_admin* default ACL, which the migration
--     role (postgres) cannot alter ("permission denied to change default privileges"). It would fail
--     `supabase db push` in prod. Future definer functions that must not be anon-callable should
--     therefore `revoke execute ... from anon, public` in their own migration (see #44 checklist).

-- Recreate both functions with an explicit "no session -> stop" guard. create-or-replace preserves
-- the existing ACL; behaviour is unchanged for authenticated callers (auth.uid() is always present).
create or replace function public.request_access(p_token text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  v_project uuid;
  v_email text := auth.jwt() ->> 'email';
  v_status public.member_status;
begin
  if auth.uid() is null then return 'invalid'; end if;

  select p.id into v_project
  from public.project_invites i
  join public.projects p on p.id = i.project_id
  where i.token = p_token and i.revoked_at is null and p.available_on_vista;
  if v_project is null then return 'invalid'; end if;

  select status into v_status from public.project_members
  where project_id = v_project and lower(email) = lower(v_email);
  if v_status = 'active' then return 'member'; end if;
  if v_status = 'pending' then return 'requested'; end if;

  insert into public.project_members (project_id, user_id, email, name, role, status)
  values (v_project, auth.uid(), v_email, coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), 'viewer', 'pending');
  return 'requested';
end $$;

create or replace function public.create_project(p_name text, p_description text, p_visibility public.project_visibility, p_available boolean)
returns public.projects language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
  v_email text := auth.jwt() ->> 'email';
  v_palette text[] := array['#aa2d00', '#1b61c9', '#0a2e0e', '#d9a441'];
  v_color text := v_palette[1 + ((select count(*) from public.projects)::int % array_length(v_palette, 1))];
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  insert into public.projects (owner_id, name, description, color, visibility, available_on_vista)
  values (auth.uid(), p_name, nullif(p_description, ''), v_color, p_visibility, p_available)
  returning * into v_project;

  insert into public.project_members (project_id, user_id, email, name, role, status)
  values (v_project.id, auth.uid(), v_email, coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), 'owner', 'active');

  return v_project;
end $$;

-- Lock to authenticated only: remove anon (the real risk — the anon key ships in the bundle) and the
-- cosmetic PUBLIC grant; re-assert the authenticated grant explicitly.
revoke execute on function public.create_project(text, text, public.project_visibility, boolean) from anon, public;
revoke execute on function public.request_access(text) from anon, public;
grant  execute on function public.create_project(text, text, public.project_visibility, boolean) to authenticated;
grant  execute on function public.request_access(text) to authenticated;
