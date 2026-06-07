-- Allowlist member-read RLS (#26). Phase 3 (#20) gave the OWNER read on the projection;
-- this adds the CLIENT path. A member sees an item only if ALL three gates pass:
--   1. the project is published (visibility='shared' AND available_on_vista),
--   2. the user is an active member,
--   3. the item is shared=true.
-- The owner still sees everything (the #20 owner-read policies remain; RLS is permissive/OR).
-- Coherence: an issue is visible only if its milestone is also shared (no orphan bars).
-- Writes stay service_role only (no client write policies).
-- Source: vault "Moteur de visibilité (allowlist)" + "RLS & politiques d'accès".

-- Gate 1: project published. SECURITY DEFINER (like is_owner/is_active_member) to avoid nested RLS.
create function public.is_project_published(p uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.projects where id = p and visibility = 'shared' and available_on_vista);
$$;

-- Gates 1+2 for a repo, used by the milestone/issue policies.
create function public.is_repo_visible_to_member(pr uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.project_repos r
    where r.id = pr and public.is_project_published(r.project_id) and public.is_active_member(r.project_id)
  );
$$;

-- Coherence: is the milestone shared? (an issue needs its parent milestone shared too)
create function public.is_milestone_shared(m uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select coalesce((select shared from public.milestones where id = m), false);
$$;

-- Member can read a published project's repos (so getRoadmap resolves repo ids).
create policy project_repos_read_member on public.project_repos for select
  using (public.is_project_published(project_id) and public.is_active_member(project_id));

-- Member reads shared milestones of a published project they belong to.
create policy milestones_read_member on public.milestones for select
  using (milestones.shared and public.is_repo_visible_to_member(milestones.project_repo_id));

-- Member reads shared issues (gates 1+2+3) whose milestone is also shared (coherence).
create policy issues_read_member on public.issues for select
  using (
    issues.shared
    and public.is_repo_visible_to_member(issues.project_repo_id)
    and (issues.milestone_id is null or public.is_milestone_shared(issues.milestone_id))
  );
