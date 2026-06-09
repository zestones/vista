-- Milestone client summary (#127, part of #124). An owner-authored, client-facing sentence per
-- milestone that translates raw GitHub text for clients. Owner-curated metadata like `shared`:
--   * the projection NEVER writes it (toMilestoneRow omits it), so a sync/webhook upsert preserves it;
--   * the owner writes it through an owner-gated SECURITY DEFINER RPC (projection writes are service_role);
--   * reads ride on the EXISTING milestones_read_member policy (it's just another column on a row the
--     member can already see) + owner-read. No new read policy.
alter table public.milestones add column client_summary text;

-- Owner-gated write (mirrors set_milestone_shared #27). auth.uid() is the caller even under security
-- definer, so is_owner gates to the real owner; errcode 42501 -> PostgREST 403.
create function public.set_milestone_client_summary(m uuid, value text) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_owner((
    select pr.project_id from public.milestones ms
    join public.project_repos pr on pr.id = ms.project_repo_id
    where ms.id = m
  )) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.milestones set client_summary = value where id = m;
end;
$$;

revoke execute on function public.set_milestone_client_summary(uuid, text) from public;
grant execute on function public.set_milestone_client_summary(uuid, text) to authenticated;
