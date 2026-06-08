-- Per-member comment access + RLS (#91). Comment visibility is gated PER MEMBER (an explicit owner
-- grant), layered on top of the per-issue allowlist gates (#26). No per-comment granularity. The owner
-- already reads all comments (comments_read_owner, #90); this adds the member read path + the grant RPC.
-- Source: vault "Features/Commentaires client.md".

-- Per-member grant. Deny-by-default: existing members see no comments until explicitly granted.
alter table public.project_members add column can_view_comments boolean not null default false;

-- An issue is visible to the current member: re-expresses the issues_read_member predicate (#26) as a
-- helper, because an RLS policy can't reference another table's policy. SECURITY DEFINER to avoid nested
-- RLS, mirroring is_repo_visible_to_member / is_milestone_shared.
create function public.is_issue_visible_to_member(i uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.issues iss
    where iss.id = i
      and iss.shared
      and public.is_repo_visible_to_member(iss.project_repo_id)
      and (iss.milestone_id is null or public.is_milestone_shared(iss.milestone_id))
  );
$$;

-- The current member has been granted comment access on this project (active membership only).
create function public.member_can_view_comments(p uuid) returns boolean
  language sql security definer stable set search_path = '' as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = p and m.user_id = auth.uid() and m.status = 'active' and m.can_view_comments
  );
$$;

-- Member reads a comment iff its parent issue is visible to them AND they hold the grant. RLS is
-- permissive (OR), so this coexists with comments_read_owner (owner sees all).
create policy comments_read_member on public.comments for select
  using (
    public.is_issue_visible_to_member(comments.issue_id)
    and public.member_can_view_comments((
      select pr.project_id from public.project_repos pr where pr.id = comments.project_repo_id
    ))
  );

-- Owner-gated grant/revoke (mirrors set_issue_shared #27). auth.uid() is the caller even under security
-- definer, so is_owner gates to the real owner. errcode 42501 -> PostgREST 403.
create function public.set_member_comment_access(m uuid, value boolean) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner((select pm.project_id from public.project_members pm where pm.id = m)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.project_members set can_view_comments = value where id = m;
end;
$$;
