-- Owner RPCs to toggle the allowlist `shared` flag (#27). Projection writes are service_role
-- only (#26), so the owner flips `shared` through these security-definer, owner-gated RPCs.
-- `auth.uid()` is the caller even under security definer, so is_owner gates to the real owner.
-- errcode 42501 -> PostgREST 403. Source: vault "Moteur de visibilité (allowlist)".

create function public.set_milestone_shared(m uuid, value boolean) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner((
    select pr.project_id from public.milestones ms
    join public.project_repos pr on pr.id = ms.project_repo_id
    where ms.id = m
  )) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.milestones set shared = value where id = m;
end;
$$;

create function public.set_issue_shared(i uuid, value boolean) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner((
    select pr.project_id from public.issues iss
    join public.project_repos pr on pr.id = iss.project_repo_id
    where iss.id = i
  )) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.issues set shared = value where id = i;
end;
$$;

-- "Share whole milestone": flip every issue under the milestone (owner-gated by the milestone's project).
create function public.set_milestone_issues_shared(m uuid, value boolean) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner((
    select pr.project_id from public.milestones ms
    join public.project_repos pr on pr.id = ms.project_repo_id
    where ms.id = m
  )) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.issues set shared = value where milestone_id = m;
end;
$$;

-- Logged-in users may attempt; the is_owner gate restricts the effect to owners. Not for anon.
revoke execute on function public.set_milestone_shared(uuid, boolean) from public;
revoke execute on function public.set_issue_shared(uuid, boolean) from public;
revoke execute on function public.set_milestone_issues_shared(uuid, boolean) from public;
grant execute on function public.set_milestone_shared(uuid, boolean) to authenticated;
grant execute on function public.set_issue_shared(uuid, boolean) to authenticated;
grant execute on function public.set_milestone_issues_shared(uuid, boolean) to authenticated;
