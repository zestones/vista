-- Realtime for roadmap + access surfaces (#129, part of #122). Broadcast issues/milestones (so the
-- roadmap updates live on webhook reprojection) and projects/project_members (so a publish or an
-- access approval reflects live). REPLICA IDENTITY FULL so postgres_changes `filter` works on
-- UPDATE/DELETE, not just INSERT (mirrors 20260608150000_realtime.sql). RLS still scopes who
-- receives each event; the RLS-scoped client refetch remains the source of truth.
--
-- COUPLING: a member can receive the publish event on `projects` only because projects_read is
-- publish-independent (is_owner OR is_active_member, see base_rls_policies.sql). If that policy is
-- ever tightened to hide unpublished projects from members, this live-publish path breaks.
alter table public.issues          replica identity full;
alter table public.milestones      replica identity full;
alter table public.projects        replica identity full;
alter table public.project_members replica identity full;

alter publication supabase_realtime
  add table public.issues, public.milestones, public.projects, public.project_members;
