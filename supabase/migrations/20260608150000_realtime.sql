-- Realtime (#37): broadcast submissions + notifications so the moderation inbox and the notification
-- bell update live. REPLICA IDENTITY FULL so postgres_changes `filter` works on UPDATE/DELETE (not
-- just INSERT). RLS still applies to who receives an event; the client refetches (RLS-scoped) anyway.
alter table public.submissions replica identity full;
alter table public.notifications replica identity full;
alter publication supabase_realtime add table public.submissions, public.notifications;
