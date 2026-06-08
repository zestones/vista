-- Comment-visibility policy tests (#94) -- the Client comments capstone. Proves the per-member comment
-- contract (#91) layered on the allowlist (#26):
--   * a GRANTED active member sees comments only on issues visible to them (shared + coherent + published),
--   * a NON-GRANTED member sees no comments,
--   * comments on a hidden/incoherent/unpublished issue stay hidden, even with the grant,
--   * a PENDING member with the grant sees nothing (status gate),
--   * a non-member sees nothing; the owner sees all (owner-read coexistence),
--   * set_member_comment_access is owner-gated (errcode 42501 -> 403) and the grant takes effect.
-- Mirrors allowlist_rls.test.sql. Run with: supabase test db
begin;
select plan(14);

-- ── Seed as superuser (RLS bypassed) ──
insert into auth.users (id, email) values
  ('a9000000-0000-0000-0000-0000000000a1', 'owner@t.co'),
  ('a9000000-0000-0000-0000-0000000000a2', 'granted@t.co'),
  ('a9000000-0000-0000-0000-0000000000a3', 'nongranted@t.co'),
  ('a9000000-0000-0000-0000-0000000000a4', 'pending@t.co'),
  ('a9000000-0000-0000-0000-0000000000a5', 'stranger@t.co');

insert into public.github_installations (installation_id, account_login, installed_by) values
  (790001, 'acme', 'a9000000-0000-0000-0000-0000000000a1');

-- PUB = published (gate 1 on); PRIV = shared but not on Vista (gate 1 off).
insert into public.projects (id, owner_id, name, visibility, available_on_vista) values
  ('b9000000-0000-0000-0000-0000000000b1', 'a9000000-0000-0000-0000-0000000000a1', 'PUB',  'shared', true),
  ('b9000000-0000-0000-0000-0000000000b2', 'a9000000-0000-0000-0000-0000000000a1', 'PRIV', 'shared', false);

-- Members: granted active (PUB + PRIV), non-granted active (PUB), granted PENDING (PUB).
insert into public.project_members (id, project_id, user_id, email, role, status, can_view_comments) values
  ('f9000000-0000-0000-0000-0000000000f1', 'b9000000-0000-0000-0000-0000000000b1', 'a9000000-0000-0000-0000-0000000000a2', 'granted@t.co',    'viewer', 'active',  true),
  ('f9000000-0000-0000-0000-0000000000f2', 'b9000000-0000-0000-0000-0000000000b2', 'a9000000-0000-0000-0000-0000000000a2', 'granted@t.co',    'viewer', 'active',  true),
  ('f9000000-0000-0000-0000-0000000000f3', 'b9000000-0000-0000-0000-0000000000b1', 'a9000000-0000-0000-0000-0000000000a3', 'nongranted@t.co', 'viewer', 'active',  false),
  ('f9000000-0000-0000-0000-0000000000f4', 'b9000000-0000-0000-0000-0000000000b1', 'a9000000-0000-0000-0000-0000000000a4', 'pending@t.co',    'viewer', 'pending', true);

insert into public.project_repos (id, project_id, installation_id, owner, repo) values
  ('c9000000-0000-0000-0000-0000000000c1', 'b9000000-0000-0000-0000-0000000000b1', 790001, 'acme', 'pub'),
  ('c9000000-0000-0000-0000-0000000000c2', 'b9000000-0000-0000-0000-0000000000b2', 790001, 'acme', 'priv');

insert into public.milestones (id, project_repo_id, number, title, shared) values
  ('d9000000-0000-0000-0000-0000000000d1', 'c9000000-0000-0000-0000-0000000000c1', 1, 'M-shared', true),
  ('d9000000-0000-0000-0000-0000000000d2', 'c9000000-0000-0000-0000-0000000000c1', 2, 'M-hidden', false),
  ('d9000000-0000-0000-0000-0000000000d3', 'c9000000-0000-0000-0000-0000000000c2', 1, 'M2-shared', true);

insert into public.issues (id, project_repo_id, milestone_id, number, title, shared) values
  ('e9000000-0000-0000-0000-0000000000e1', 'c9000000-0000-0000-0000-0000000000c1', 'd9000000-0000-0000-0000-0000000000d1', 1, 'i-shared+ms',   true),  -- visible
  ('e9000000-0000-0000-0000-0000000000e2', 'c9000000-0000-0000-0000-0000000000c1', 'd9000000-0000-0000-0000-0000000000d1', 2, 'i-unshared',    false), -- gate 3 -> hidden
  ('e9000000-0000-0000-0000-0000000000e3', 'c9000000-0000-0000-0000-0000000000c1', 'd9000000-0000-0000-0000-0000000000d2', 3, 'i-coherence',   true),  -- coherence -> hidden
  ('e9000000-0000-0000-0000-0000000000e4', 'c9000000-0000-0000-0000-0000000000c1', null,                                   4, 'i-unsched',     true),  -- visible (no milestone)
  ('e9000000-0000-0000-0000-0000000000e5', 'c9000000-0000-0000-0000-0000000000c2', 'd9000000-0000-0000-0000-0000000000d3', 1, 'i2-shared',     true);  -- gate 1 -> hidden

-- One comment per issue (github_comment_id 1..5).
insert into public.comments (project_repo_id, issue_id, github_comment_id, body) values
  ('c9000000-0000-0000-0000-0000000000c1', 'e9000000-0000-0000-0000-0000000000e1', 1, 'on shared+ms'),
  ('c9000000-0000-0000-0000-0000000000c1', 'e9000000-0000-0000-0000-0000000000e2', 2, 'on unshared issue'),
  ('c9000000-0000-0000-0000-0000000000c1', 'e9000000-0000-0000-0000-0000000000e3', 3, 'under hidden milestone'),
  ('c9000000-0000-0000-0000-0000000000c1', 'e9000000-0000-0000-0000-0000000000e4', 4, 'on unscheduled shared'),
  ('c9000000-0000-0000-0000-0000000000c2', 'e9000000-0000-0000-0000-0000000000e5', 5, 'in unpublished project');

set local role authenticated;

-- ── Owner sees every comment (owner-read, #90) ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a1"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 4, 'owner sees all comments on the published repo');
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c2')::int, 1, 'owner sees the comment in the unpublished repo');

-- ── Granted active member: only comments on visible issues ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a2"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 2, 'granted member sees only comments on visible issues');
select is((select count(*) from public.comments where github_comment_id = 1)::int, 1, 'granted: comment on a shared+coherent issue is visible');
select is((select count(*) from public.comments where github_comment_id = 4)::int, 1, 'granted: comment on a shared null-milestone issue is visible');
select is((select count(*) from public.comments where github_comment_id = 2)::int, 0, 'granted: comment on a non-shared issue stays hidden');
select is((select count(*) from public.comments where github_comment_id = 3)::int, 0, 'granted: comment under a hidden milestone stays hidden (coherence)');
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c2')::int, 0, 'gate 1: granted member sees no comments in an unpublished project');

-- ── Non-granted active member sees nothing ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a3"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 0, 'non-granted member sees no comments');

-- ── Pending member holding the grant sees nothing (status gate) ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a4"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 0, 'pending member with the grant sees no comments (status gate)');

-- ── Non-member sees nothing ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a5"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 0, 'non-member sees no comments');

-- ── set_member_comment_access is owner-gated (non-owner -> 42501 -> 403) ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a3"}';
select throws_ok($$ select public.set_member_comment_access('f9000000-0000-0000-0000-0000000000f3', true) $$, '42501', null, 'non-owner cannot grant comment access');

-- ── Owner grants the non-granted member, and the grant takes effect ──
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a1"}';
select lives_ok($$ select public.set_member_comment_access('f9000000-0000-0000-0000-0000000000f3', true) $$, 'owner can grant comment access');
set local request.jwt.claims = '{"sub":"a9000000-0000-0000-0000-0000000000a3"}';
select is((select count(*) from public.comments where project_repo_id = 'c9000000-0000-0000-0000-0000000000c1')::int, 2, 'after the owner grant, the member sees comments on visible issues');

select * from finish();
rollback;
