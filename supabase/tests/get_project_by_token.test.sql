-- get_project_by_token RPC tests (#16). Run with: supabase test db
begin;
select plan(7);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111101', 'owner@t.co');
insert into public.projects (id, owner_id, name, description, color, available_on_vista) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'P1', 'desc', '#fff', true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111101', 'Hidden', null, null, false);
insert into public.project_members (project_id, user_id, email, role, status) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'owner@t.co', 'owner', 'active');
insert into public.project_invites (project_id, token) values
  ('22222222-2222-2222-2222-222222222201', 'valid-token'),
  ('22222222-2222-2222-2222-222222222202', 'hidden-token');
insert into public.project_invites (project_id, token, revoked_at) values
  ('22222222-2222-2222-2222-222222222201', 'revoked-token', now());

-- valid token
select is((select count(*) from public.get_project_by_token('valid-token'))::int, 1, 'valid token resolves to one row');
select is((select name from public.get_project_by_token('valid-token')), 'P1', 'returns the project name');
select is((select member_count from public.get_project_by_token('valid-token'))::int, 1, 'returns the active member count');
-- invalid cases
select is((select count(*) from public.get_project_by_token('revoked-token'))::int, 0, 'revoked token is invalid');
select is((select count(*) from public.get_project_by_token('does-not-exist'))::int, 0, 'unknown token is invalid');
select is((select count(*) from public.get_project_by_token('hidden-token'))::int, 0, 'unavailable project is invalid');
-- callable before sign-in (join page)
select ok(has_function_privilege('anon', 'public.get_project_by_token(text)', 'execute'), 'anon can call the RPC');

select * from finish();
rollback;
