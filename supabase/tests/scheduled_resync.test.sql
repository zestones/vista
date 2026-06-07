-- Scheduled re-sync tests (#24). Run with: supabase test db
-- Guards the two security/wiring properties of the cron: the trigger function is not
-- client-callable, and the hourly job is registered.
begin;
select plan(3);

select ok(
  not has_function_privilege('anon', 'public.resync_all_repos()', 'execute'),
  'resync_all_repos is not executable by anon'
);
select ok(
  not has_function_privilege('authenticated', 'public.resync_all_repos()', 'execute'),
  'resync_all_repos is not executable by authenticated'
);
select is(
  (select count(*)::int from cron.job where jobname = 'vista-hourly-resync'),
  1, 'hourly re-sync cron job is registered'
);

select * from finish();
rollback;
