-- Realtime enablement (#129): the roadmap + access tables must be in the supabase_realtime
-- publication AND have replica identity full (so postgres_changes filters work on UPDATE/DELETE).
-- Run with: supabase test db
begin;
select plan(8);

-- ── In the supabase_realtime publication ──
select ok(exists(select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'issues'),
  'issues is in supabase_realtime');
select ok(exists(select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'milestones'),
  'milestones is in supabase_realtime');
select ok(exists(select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'),
  'projects is in supabase_realtime');
select ok(exists(select 1 from pg_publication_tables
  where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'project_members'),
  'project_members is in supabase_realtime');

-- ── Replica identity FULL ('f') ──
select is((select relreplident::text from pg_class where oid = 'public.issues'::regclass),          'f', 'issues replica identity full');
select is((select relreplident::text from pg_class where oid = 'public.milestones'::regclass),      'f', 'milestones replica identity full');
select is((select relreplident::text from pg_class where oid = 'public.projects'::regclass),        'f', 'projects replica identity full');
select is((select relreplident::text from pg_class where oid = 'public.project_members'::regclass), 'f', 'project_members replica identity full');

select * from finish();
rollback;
