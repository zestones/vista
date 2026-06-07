-- Projection owner-read RLS tests (#20). Run with: supabase test db
-- Verifies the owner reads their own installation/repos/roadmap and a stranger reads nothing.
begin;
select plan(8);

-- Seed as superuser (RLS bypassed).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-1111111111a1', 'owner@t.co'),
  ('11111111-1111-1111-1111-1111111111a2', 'stranger@t.co');
insert into public.projects (id, owner_id, name) values
  ('22222222-2222-2222-2222-2222222222a1', '11111111-1111-1111-1111-1111111111a1', 'P');
insert into public.github_installations (installation_id, account_login, installed_by) values
  (4242, 'acme', '11111111-1111-1111-1111-1111111111a1');
insert into public.project_repos (id, project_id, installation_id, owner, repo) values
  ('33333333-3333-3333-3333-3333333333a1', '22222222-2222-2222-2222-2222222222a1', 4242, 'acme', 'web');
insert into public.milestones (id, project_repo_id, number, title) values
  ('44444444-4444-4444-4444-4444444444a1', '33333333-3333-3333-3333-3333333333a1', 1, 'M1');
insert into public.issues (id, project_repo_id, number, title) values
  ('55555555-5555-5555-5555-5555555555a1', '33333333-3333-3333-3333-3333333333a1', 1, 'I1');

set local role authenticated;

-- Owner reads their own projection.
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-1111111111a1"}';
select is((select count(*) from public.github_installations)::int, 1, 'owner sees their installation');
select is((select count(*) from public.project_repos)::int, 1, 'owner sees their attached repo');
select is((select count(*) from public.milestones)::int, 1, 'owner sees their milestones');
select is((select count(*) from public.issues)::int, 1, 'owner sees their issues');

-- Stranger reads nothing (deny-all holds for non-owners; member allowlist = Phase 4).
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-1111111111a2"}';
select is((select count(*) from public.github_installations)::int, 0, 'stranger sees no installations');
select is((select count(*) from public.project_repos)::int, 0, 'stranger sees no repos');
select is((select count(*) from public.milestones)::int, 0, 'stranger sees no milestones');
select is((select count(*) from public.issues)::int, 0, 'stranger sees no issues');

select * from finish();
rollback;
