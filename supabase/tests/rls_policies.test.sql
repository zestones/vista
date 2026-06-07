-- RLS policy tests (#14). Run with: supabase test db
-- Verifies the security boundary: non-members read nothing, members read their project,
-- and submission writes are role-gated. Impersonation via set role + request.jwt.claims.
begin;
select plan(7);

-- Seed as the superuser (RLS bypassed).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111101', 'owner@t.co'),
  ('11111111-1111-1111-1111-111111111102', 'viewer@t.co'),
  ('11111111-1111-1111-1111-111111111103', 'stranger@t.co'),
  ('11111111-1111-1111-1111-111111111104', 'editor@t.co');
insert into public.projects (id, owner_id, name) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'P');
insert into public.project_members (project_id, user_id, email, role, status) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111102', 'viewer@t.co', 'viewer', 'active'),
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111104', 'editor@t.co', 'editor', 'active');
insert into public.submissions (project_id, title) values
  ('22222222-2222-2222-2222-222222222201', 'S');

set local role authenticated;

-- Owner
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111101"}';
select is((select count(*) from public.projects)::int, 1, 'owner sees their project');
select is((select count(*) from public.submissions)::int, 1, 'owner sees submissions (moderation)');

-- Active viewer
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111102"}';
select is((select count(*) from public.projects)::int, 1, 'active member sees the project');
select throws_ok(
  $$ insert into public.submissions (project_id, title) values ('22222222-2222-2222-2222-222222222201', 'nope') $$,
  '42501', null, 'viewer cannot insert a submission'
);

-- Editor
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111104"}';
select lives_ok(
  $$ insert into public.submissions (project_id, title) values ('22222222-2222-2222-2222-222222222201', 'ok') $$,
  'editor can insert a submission'
);

-- Stranger (non-member)
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111103"}';
select is((select count(*) from public.projects)::int, 0, 'non-member sees no projects');
select is((select count(*) from public.project_members)::int, 0, 'non-member sees no members');

select * from finish();
rollback;
