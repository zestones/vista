-- Milestone client summary tests (#127). Proves the owner-curated `client_summary`:
--   * the write RPC is owner-gated (42501 -> 403),
--   * a member reads it only on a shared milestone of a PUBLISHED project (rides on allowlist read),
--   * an unshared milestone / unpublished project / non-member exposes nothing,
--   * a sync upsert that omits client_summary preserves the owner's text.
-- Run with: supabase test db
begin;
select plan(8);

-- ── Seed as superuser (RLS bypassed) ──
insert into auth.users (id, email) values
  ('f0000000-0000-0000-0000-0000000000a1', 'owner@cs.co'),
  ('f0000000-0000-0000-0000-0000000000a2', 'member@cs.co'),
  ('f0000000-0000-0000-0000-0000000000a3', 'stranger@cs.co');

insert into public.github_installations (installation_id, account_login, installed_by) values
  (760001, 'csacme', 'f0000000-0000-0000-0000-0000000000a1');

-- PUB = published (shared + available_on_vista); UNPUB = shared but not on Vista (gate 1 off).
insert into public.projects (id, owner_id, name, visibility, available_on_vista) values
  ('f0000000-0000-0000-0000-0000000000b1', 'f0000000-0000-0000-0000-0000000000a1', 'PUB',   'shared', true),
  ('f0000000-0000-0000-0000-0000000000b2', 'f0000000-0000-0000-0000-0000000000a1', 'UNPUB', 'shared', false);

insert into public.project_members (project_id, user_id, email, role, status) values
  ('f0000000-0000-0000-0000-0000000000b1', 'f0000000-0000-0000-0000-0000000000a2', 'member@cs.co', 'viewer', 'active'),
  ('f0000000-0000-0000-0000-0000000000b2', 'f0000000-0000-0000-0000-0000000000a2', 'member@cs.co', 'viewer', 'active');

insert into public.project_repos (id, project_id, installation_id, owner, repo) values
  ('f0000000-0000-0000-0000-0000000000c1', 'f0000000-0000-0000-0000-0000000000b1', 760001, 'csacme', 'pub'),
  ('f0000000-0000-0000-0000-0000000000c2', 'f0000000-0000-0000-0000-0000000000b2', 760001, 'csacme', 'unpub');

insert into public.milestones (id, project_repo_id, number, title, shared) values
  ('f0000000-0000-0000-0000-0000000000d1', 'f0000000-0000-0000-0000-0000000000c1', 1, 'M-shared',   true),
  ('f0000000-0000-0000-0000-0000000000d2', 'f0000000-0000-0000-0000-0000000000c1', 2, 'M-unshared', false),
  ('f0000000-0000-0000-0000-0000000000d3', 'f0000000-0000-0000-0000-0000000000c2', 1, 'M-unpub',    true);

set local role authenticated;

-- ── Owner can write the summary, and reads it back (owner-read) ──
set local request.jwt.claims = '{"sub":"f0000000-0000-0000-0000-0000000000a1"}';
select lives_ok(
  $$ select public.set_milestone_client_summary('f0000000-0000-0000-0000-0000000000d1', 'Phase 2 delivered') $$,
  'owner can set_milestone_client_summary');
select is(
  (select client_summary from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d1'),
  'Phase 2 delivered', 'owner reads the summary back');

-- ── Non-owner (member) is rejected by the RPC ──
set local request.jwt.claims = '{"sub":"f0000000-0000-0000-0000-0000000000a2"}';
select throws_ok(
  $$ select public.set_milestone_client_summary('f0000000-0000-0000-0000-0000000000d1', 'hax') $$,
  '42501', null, 'non-owner cannot set_milestone_client_summary');

-- ── Member reads the summary on a shared milestone of a published project ──
select is(
  (select client_summary from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d1'),
  'Phase 2 delivered', 'member reads summary on a shared+published milestone');

-- ── No exposure: unshared milestone, unpublished project, non-member ──
select is((select count(*) from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d2')::int, 0,
  'member cannot see an unshared milestone (so no summary)');
select is((select count(*) from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d3')::int, 0,
  'gate 1: unpublished project hides the milestone (so no summary)');
set local request.jwt.claims = '{"sub":"f0000000-0000-0000-0000-0000000000a3"}';
select is((select count(*) from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d1')::int, 0,
  'non-member sees nothing');

-- ── A sync upsert that omits client_summary preserves the owner's text (projection invariant) ──
reset role;
insert into public.milestones (project_repo_id, number, title, shared, updated_at)
  values ('f0000000-0000-0000-0000-0000000000c1', 1, 'M-shared-renamed', false, now())
  on conflict (project_repo_id, number) do update
    set title = excluded.title, updated_at = excluded.updated_at;
select is(
  (select client_summary from public.milestones where id = 'f0000000-0000-0000-0000-0000000000d1'),
  'Phase 2 delivered', 'sync upsert (omitting client_summary) preserves it');

select * from finish();
rollback;
