-- Issue comments projection (#90, Client comments milestone). The read-model cache for GitHub issue
-- comments, populated by the sync (backfill + incremental) and the issue_comment webhook. Comments
-- carry NO `shared` allowlist column: their visibility is DERIVED from the parent issue's gates plus a
-- per-member grant (#91), not a per-comment flag. So the projection "never write shared" invariant has
-- nothing to clobber here. Owner-read lands now (mirrors #20); member-read + can_view_comments is #91.
-- Source: vault "Features/Commentaires client.md".

create table public.comments (
  id                uuid primary key default gen_random_uuid(),
  project_repo_id   uuid not null references public.project_repos (id) on delete cascade,
  issue_id          uuid not null references public.issues (id) on delete cascade,
  github_comment_id bigint not null,                  -- GitHub's numeric comment id
  author_login      text,
  author_avatar_url text,
  body              text,                             -- raw GitHub-flavored markdown; sanitized at render (#92)
  created_at        timestamptz,                      -- GitHub comment created_at
  updated_at        timestamptz,                      -- GitHub comment updated_at (edit time; NOT projection bookkeeping)
  -- Scoped to the repo link, not globally: a repo attached to several projects fans out to one row each.
  unique (project_repo_id, github_comment_id)
);
create index on public.comments (issue_id);

-- Deny-all by default; the owner-read path lands here, member-read is #91. Writes are service_role only
-- (the sync / webhook Edge functions) -- no client write policies.
alter table public.comments enable row level security;

-- Owner reads comments whose repo belongs to a project they own (mirrors issues_read_owner #20).
create policy comments_read_owner on public.comments for select
  using (
    exists (
      select 1 from public.project_repos pr
      where pr.id = comments.project_repo_id and public.is_owner(pr.project_id)
    )
  );

-- Realtime so the comment sidebar (#92) updates live. REPLICA IDENTITY FULL so postgres_changes
-- `filter` works on UPDATE/DELETE (not just INSERT). RLS still scopes who receives an event.
alter table public.comments replica identity full;
alter publication supabase_realtime add table public.comments;
