-- Join-page token resolution (#16). Source: vault "Features/Invitations & flux de jonction.md".
-- SECURITY DEFINER so an anon/non-member can resolve a share link, but it returns ONLY public
-- fields (no owner_id/visibility) for a valid, non-revoked token on an available project.
-- Invites themselves are not client-selectable under RLS (#14) -- this RPC is the controlled read.
create function public.get_project_by_token(p_token text)
returns table (id uuid, name text, description text, color text, member_count bigint)
  language sql security definer stable set search_path = '' as $$
  select
    p.id,
    p.name,
    p.description,
    p.color,
    (select count(*) from public.project_members m where m.project_id = p.id and m.status = 'active')
  from public.project_invites i
  join public.projects p on p.id = i.project_id
  where i.token = p_token
    and i.revoked_at is null
    and p.available_on_vista;
$$;

-- Intentionally public: the join page resolves a token before sign-in / membership.
grant execute on function public.get_project_by_token(text) to anon, authenticated;
