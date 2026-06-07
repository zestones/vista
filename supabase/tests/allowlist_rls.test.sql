-- Allowlist policy tests (#31) -- the Phase 4 capstone. Proves the client visibility contract:
--   * a member of a PUBLISHED project sees only shared items (gates 1+2+3) + coherence,
--   * an UNPUBLISHED project hides everything from the member (gate 1),
--   * a non-member sees nothing,
--   * the share RPCs are owner-gated (incl. set_project_shared),
-- complementing rls_policies.test.sql (non-member nothing, viewer cannot submit) and
-- projection_rls.test.sql (owner-read). Run with: supabase test db
begin;
select plan(19);

-- ── Seed as superuser (RLS bypassed) ──
insert into auth.users (id, email) values
  ('a0000000-0000-0000-0000-0000000000a1', 'owner@t.co'),
  ('a0000000-0000-0000-0000-0000000000a2', 'member@t.co'),
  ('a0000000-0000-0000-0000-0000000000a3', 'stranger@t.co');

insert into public.github_installations (installation_id, account_login, installed_by) values
  (700001, 'acme', 'a0000000-0000-0000-0000-0000000000a1');

-- PUB = published (visibility shared + available_on_vista); PRIV = shared but not on Vista (gate 1 off).
insert into public.projects (id, owner_id, name, visibility, available_on_vista) values
  ('b0000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-0000000000a1', 'PUB',  'shared', true),
  ('b0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-0000000000a1', 'PRIV', 'shared', false);

-- Same member is an active viewer of BOTH projects (so only gate 1 differs between them).
insert into public.project_members (project_id, user_id, email, role, status) values
  ('b0000000-0000-0000-0000-0000000000b1', 'a0000000-0000-0000-0000-0000000000a2', 'member@t.co', 'viewer', 'active'),
  ('b0000000-0000-0000-0000-0000000000b2', 'a0000000-0000-0000-0000-0000000000a2', 'member@t.co', 'viewer', 'active');

insert into public.project_repos (id, project_id, installation_id, owner, repo) values
  ('c0000000-0000-0000-0000-0000000000c1', 'b0000000-0000-0000-0000-0000000000b1', 700001, 'acme', 'pub'),
  ('c0000000-0000-0000-0000-0000000000c2', 'b0000000-0000-0000-0000-0000000000b2', 700001, 'acme', 'priv');

insert into public.milestones (id, project_repo_id, number, title, shared) values
  ('d0000000-0000-0000-0000-0000000000d1', 'c0000000-0000-0000-0000-0000000000c1', 1, 'M-shared', true),
  ('d0000000-0000-0000-0000-0000000000d2', 'c0000000-0000-0000-0000-0000000000c1', 2, 'M-hidden', false),
  ('d0000000-0000-0000-0000-0000000000d3', 'c0000000-0000-0000-0000-0000000000c2', 1, 'M2-shared', true);

insert into public.issues (id, project_repo_id, milestone_id, number, title, shared) values
  ('e0000000-0000-0000-0000-0000000000e1', 'c0000000-0000-0000-0000-0000000000c1', 'd0000000-0000-0000-0000-0000000000d1', 1, 'i-shared',   true),  -- visible
  ('e0000000-0000-0000-0000-0000000000e2', 'c0000000-0000-0000-0000-0000000000c1', 'd0000000-0000-0000-0000-0000000000d1', 2, 'i-unshared', false), -- gate 3 -> hidden
  ('e0000000-0000-0000-0000-0000000000e3', 'c0000000-0000-0000-0000-0000000000c1', 'd0000000-0000-0000-0000-0000000000d2', 3, 'i-orphan',   true),  -- coherence -> hidden
  ('e0000000-0000-0000-0000-0000000000e4', 'c0000000-0000-0000-0000-0000000000c1', null,                                   4, 'i-unsched',  true),  -- visible (no milestone)
  ('e0000000-0000-0000-0000-0000000000e5', 'c0000000-0000-0000-0000-0000000000c2', 'd0000000-0000-0000-0000-0000000000d3', 1, 'i2-shared',  true);  -- gate 1 -> hidden

set local role authenticated;

-- ── Owner sees everything (owner-read, #20) ──
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-0000000000a1"}';
select is((select count(*) from public.milestones where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 2, 'owner sees all milestones (pub)');
select is((select count(*) from public.issues     where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 4, 'owner sees all issues (pub)');
select is((select count(*) from public.milestones where project_repo_id = 'c0000000-0000-0000-0000-0000000000c2')::int, 1, 'owner sees all milestones (priv)');
select is((select count(*) from public.issues     where project_repo_id = 'c0000000-0000-0000-0000-0000000000c2')::int, 1, 'owner sees all issues (priv)');

-- ── Member of the PUBLISHED project: only shared, with coherence ──
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-0000000000a2"}';
select is((select count(*) from public.milestones where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 1, 'member sees only the shared milestone');
select is((select count(*) from public.milestones where id = 'd0000000-0000-0000-0000-0000000000d2')::int, 0, 'member cannot see a non-shared milestone');
select is((select count(*) from public.issues     where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 2, 'member sees only the two coherent shared issues');
select is((select count(*) from public.issues where id = 'e0000000-0000-0000-0000-0000000000e2')::int, 0, 'gate 3: member cannot see a non-shared issue');
select is((select count(*) from public.issues where id = 'e0000000-0000-0000-0000-0000000000e3')::int, 0, 'coherence: shared issue under a hidden milestone is hidden');
select is((select count(*) from public.issues where id = 'e0000000-0000-0000-0000-0000000000e4')::int, 1, 'member sees a shared unscheduled issue');

-- ── Gate 1: the same member sees nothing in the UNPUBLISHED project ──
select is((select count(*) from public.milestones where project_repo_id = 'c0000000-0000-0000-0000-0000000000c2')::int, 0, 'gate 1: unpublished project hides milestones');
select is((select count(*) from public.issues     where project_repo_id = 'c0000000-0000-0000-0000-0000000000c2')::int, 0, 'gate 1: unpublished project hides issues');

-- ── Non-member sees nothing ──
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-0000000000a3"}';
select is((select count(*) from public.milestones where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 0, 'non-member sees no milestones');
select is((select count(*) from public.issues     where project_repo_id = 'c0000000-0000-0000-0000-0000000000c1')::int, 0, 'non-member sees no issues');

-- ── Share RPCs are owner-gated: a member (non-owner) is rejected (errcode 42501 -> 403) ──
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-0000000000a2"}';
select throws_ok($$ select public.set_milestone_shared('d0000000-0000-0000-0000-0000000000d1', true) $$,        '42501', null, 'non-owner cannot set_milestone_shared');
select throws_ok($$ select public.set_issue_shared('e0000000-0000-0000-0000-0000000000e1', true) $$,            '42501', null, 'non-owner cannot set_issue_shared');
select throws_ok($$ select public.set_milestone_issues_shared('d0000000-0000-0000-0000-0000000000d1', true) $$, '42501', null, 'non-owner cannot set_milestone_issues_shared');
select throws_ok($$ select public.set_project_shared('b0000000-0000-0000-0000-0000000000b1', true) $$,          '42501', null, 'non-owner cannot set_project_shared');

-- ── Owner can use the project-level RPC ──
set local request.jwt.claims = '{"sub":"a0000000-0000-0000-0000-0000000000a1"}';
select lives_ok($$ select public.set_project_shared('b0000000-0000-0000-0000-0000000000b1', false) $$, 'owner can set_project_shared');

select * from finish();
rollback;
