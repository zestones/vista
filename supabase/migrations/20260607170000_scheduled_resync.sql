-- Scheduled re-sync (#24): an hourly pg_cron job that fires sync-repo (#22) for every
-- project_repo via pg_net, authed with the SYNC_TRIGGER_SECRET. Safety net for webhooks
-- missed during downtime. Bounded: sync-repo is incremental (since + ETag/304) and this
-- fires one async POST per repo per hour.
--
-- The sync-repo URL and trigger secret are env-specific + SECRET, so they live in
-- supabase_vault and are set OUT OF BAND (never in this committed migration):
--   select vault.create_secret('<sync-repo url>',        'sync_repo_url');
--   select vault.create_secret('<SYNC_TRIGGER_SECRET>',  'sync_trigger_secret');
-- Local dev url: http://host.docker.internal:54321/functions/v1/sync-repo
-- Deployed:      https://<project-ref>.supabase.co/functions/v1/sync-repo

create extension if not exists pg_cron;
-- pg_net + supabase_vault are enabled by the platform.

-- Fire sync-repo for every attached repo. SECURITY DEFINER so it can read the vault secret
-- and project_repos; locked to the cron (no client/anon/authenticated execute).
create or replace function public.resync_all_repos() returns void
  language plpgsql security definer set search_path = '' as $$
declare
  v_url    text := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_repo_url');
  v_secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'sync_trigger_secret');
begin
  if v_url is null or v_secret is null then
    raise notice 'resync_all_repos: sync_repo_url / sync_trigger_secret not set in vault; skipping';
    return;
  end if;
  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_secret),
    body := jsonb_build_object('project_repo_id', pr.id)
  )
  from public.project_repos pr;
end;
$$;

revoke execute on function public.resync_all_repos() from public, anon, authenticated;

-- Hourly. cron.schedule upserts by name, so re-running this migration is idempotent.
select cron.schedule('vista-hourly-resync', '0 * * * *', $$select public.resync_all_repos()$$);
