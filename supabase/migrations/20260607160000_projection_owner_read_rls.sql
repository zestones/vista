-- Owner-read RLS on the projection (#20). The projection was deny-all (#14/#64);
-- this grants the OWNER read access to their own installation, attached repos, and
-- roadmap so the connect-repos UI and getRoadmap render. The member-sees-`shared`
-- allowlist read is Phase 4. Writes stay server-side (service_role via the
-- connect-repos / sync Edge functions) -- no client write policies here.

-- github_installations: owner reads the installations they created (#19 sets installed_by).
create policy installations_read_own on public.github_installations for select
  using (installed_by = auth.uid());

-- project_repos: owner reads repos attached to a project they own.
create policy project_repos_read_owner on public.project_repos for select
  using (public.is_owner(project_id));

-- milestones / issues: owner reads rows whose repo belongs to a project they own.
create policy milestones_read_owner on public.milestones for select
  using (
    exists (
      select 1 from public.project_repos pr
      where pr.id = milestones.project_repo_id and public.is_owner(pr.project_id)
    )
  );
create policy issues_read_owner on public.issues for select
  using (
    exists (
      select 1 from public.project_repos pr
      where pr.id = issues.project_repo_id and public.is_owner(pr.project_id)
    )
  );
