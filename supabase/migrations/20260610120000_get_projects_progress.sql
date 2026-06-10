-- get_projects_for_user: compute real progress aggregates (was stubbed `'progress', null` at #15).
-- Progress = projected issues for the project (via project_repos), the closed count, and the percent.
-- Null when the project has no projected issues (matches the mock `summarize` invariant). Read-only;
-- the rows are already access-scoped by the `accessible` CTE, so no new exposure. Lights up the
-- progress bar on both the desktop ProjectCard and the mobile home cards (#221).
create or replace function public.get_projects_for_user() returns jsonb
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
        'progress', (
          select case when count(*) = 0 then null else jsonb_build_object(
            'total', count(*),
            'closed', count(*) filter (where i.state = 'closed'),
            'pct', round((count(*) filter (where i.state = 'closed'))::numeric * 100 / count(*))::int
          ) end
          from public.issues i
          join public.project_repos r on r.id = i.project_repo_id
          where r.project_id = a.id
        ),
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
