-- Security S2 (#183): revoke EXECUTE on notify() from every browser-reachable role.
--
-- public.notify(uuid,uuid,notification_kind,jsonb,text) is SECURITY DEFINER (bypasses RLS) and its
-- only guard is "don't self-notify". kind/data/link are caller-controlled, and the anon key ships in
-- the client bundle, so any visitor could flood/phish another user's bell. notify() is never called
-- directly by the app — every caller is a SECURITY DEFINER trigger function owned by postgres
-- (on_submission_notify, on_submission_message_notify, on_member_notify), which run as postgres and
-- keep EXECUTE as the function owner. So the triggers keep working; only the client paths are closed.
--
-- Naming all three roles is required: anon/authenticated hold EXPLICIT grants via pg_default_acl, so
-- `revoke ... from public` alone is a no-op here (see #185 / memory vista-supabase-grant-gotcha).

revoke execute on function public.notify(uuid, uuid, public.notification_kind, jsonb, text)
  from public, anon, authenticated;
