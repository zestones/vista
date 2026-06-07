-- RPCs for the service wiring (#15). All security definer + search_path='' (schema-qualified).
-- These compute server-side aggregates (RLS-safe) and encapsulate writes that RLS gates.

-- ─── create_project: project + owner membership, atomically (#15) ──
-- RLS allows the owner to insert both, but an RPC makes it atomic and keeps the owner check trivial.
create function public.create_project(
  p_name text, p_description text, p_visibility public.project_visibility, p_available boolean
) returns public.projects
  language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
  v_email text := auth.jwt() ->> 'email';
begin
  insert into public.projects (owner_id, name, description, visibility, available_on_vista)
  values (auth.uid(), p_name, nullif(p_description, ''), p_visibility, p_available)
  returning * into v_project;

  insert into public.project_members (project_id, user_id, email, name, role, status)
  values (v_project.id, auth.uid(), v_email, coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), 'owner', 'active');

  return v_project;
end $$;
grant execute on function public.create_project(text, text, public.project_visibility, boolean) to authenticated;

-- ─── get_projects_for_user: owned/joined summaries with server-side aggregates (#15) ──
-- Definer so member counts are accurate even for joined projects (RLS would scope them to self).
create function public.get_projects_for_user() returns jsonb
  language sql security definer stable set search_path = '' as $$
  with accessible as (
    select p.*
    from public.projects p
    where p.owner_id = auth.uid()
       or exists (
         select 1 from public.project_members m
         where m.project_id = p.id and m.user_id = auth.uid() and m.status = 'active'
       )
  ),
  summary as (
    select
      (a.owner_id = auth.uid()) as is_owned,
      jsonb_build_object(
        'project', to_jsonb(a),
        'activeMembers', (select count(*) from public.project_members m where m.project_id = a.id and m.status = 'active'),
        'pendingMembers', (select count(*) from public.project_members m where m.project_id = a.id and m.status = 'pending'),
        'progress', null,
        'repos', coalesce(
          (select jsonb_agg(jsonb_build_object('owner', r.owner, 'repo', r.repo)) from public.project_repos r where r.project_id = a.id),
          '[]'::jsonb)
      ) as summary
    from accessible a
  )
  select jsonb_build_object(
    'owned', coalesce((select jsonb_agg(summary) from summary where is_owned), '[]'::jsonb),
    'joined', coalesce((select jsonb_agg(summary) from summary where not is_owned), '[]'::jsonb)
  );
$$;
grant execute on function public.get_projects_for_user() to authenticated;

-- ─── request_access: token-gated join request (#15) ──
-- A non-member can't insert their own membership under RLS; this validates the token and
-- inserts a pending viewer for the caller. Idempotent for existing members/requests.
create function public.request_access(p_token text) returns text
  language plpgsql security definer set search_path = '' as $$
declare
  v_project uuid;
  v_email text := auth.jwt() ->> 'email';
  v_status public.member_status;
begin
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
grant execute on function public.request_access(text) to authenticated;
