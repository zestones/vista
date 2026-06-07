-- Project-level "share everything" (#2). Owner-gated; flips every milestone + issue under the
-- project in one round trip. Mirrors the per-item RPCs in 20260607190000_share_rpcs.sql
-- (security definer, is_owner gate, errcode 42501 -> 403). Source: "Moteur de visibilité (allowlist)".
create function public.set_project_shared(p uuid, value boolean) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner(p) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.milestones ms set shared = value
    from public.project_repos pr
    where pr.id = ms.project_repo_id and pr.project_id = p;
  update public.issues iss set shared = value
    from public.project_repos pr
    where pr.id = iss.project_repo_id and pr.project_id = p;
end;
$$;

revoke execute on function public.set_project_shared(uuid, boolean) from public;
grant execute on function public.set_project_shared(uuid, boolean) to authenticated;
