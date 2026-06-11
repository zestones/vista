-- Public read-only share links (#193). A tokenized link opens the allowlist-scoped client Overview
-- with no account, through the SAME visibility rules as a member. Fail-closed. One active link per
-- project; always has an expiry (set by the owner); revocable. Source: epic #124 / vault Frontend.

create table public.project_share_links (
  id               uuid primary key default gen_random_uuid(),
  project_id       uuid not null references public.projects (id) on delete cascade,
  token            text not null unique,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  revoked_at       timestamptz,
  last_accessed_at timestamptz,
  access_count     integer not null default 0
);

-- At most one non-revoked link per project (the "one active link" guarantee; rotate revokes the old).
create unique index project_share_links_one_active on public.project_share_links (project_id) where revoked_at is null;

alter table public.project_share_links enable row level security;

-- Owners manage their own project's links; clients/anon never select the table directly (the read goes
-- through the SECURITY DEFINER RPC below, which returns only public fields).
create policy share_links_owner_all on public.project_share_links
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ─── Owner: rotate (revoke existing active + issue a fresh token) ───
create function public.rotate_share_link(p_project uuid, p_expires timestamptz)
returns public.project_share_links language plpgsql security definer set search_path = '' as $$
declare
  v_row public.project_share_links;
begin
  if not exists (select 1 from public.projects p where p.id = p_project and p.owner_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  update public.project_share_links set revoked_at = now() where project_id = p_project and revoked_at is null;
  insert into public.project_share_links (project_id, token, expires_at)
    values (p_project, encode(extensions.gen_random_bytes(16), 'base64'), p_expires)
    returning * into v_row;
  return v_row;
end;
$$;

-- ─── Owner: revoke the active link ───
create function public.revoke_share_link(p_project uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.projects p where p.id = p_project and p.owner_id = auth.uid()) then
    raise exception 'not authorized';
  end if;
  update public.project_share_links set revoked_at = now() where project_id = p_project and revoked_at is null;
end;
$$;

-- ─── Public: resolve a token to the allowlist-scoped roadmap (no account) ───
-- Fail-closed: only a valid, non-revoked, non-expired token on a PUBLISHED project resolves; returns
-- only shared milestones/issues + public project fields (never owner_id/visibility). Stamps usage.
create function public.get_public_roadmap(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_link public.project_share_links;
  v_project public.projects;
  v_result jsonb;
begin
  select * into v_link from public.project_share_links
    where token = p_token and revoked_at is null and expires_at > now();
  if not found then return null; end if;

  select * into v_project from public.projects where id = v_link.project_id and available_on_vista;
  if not found then return null; end if;

  update public.project_share_links
    set last_accessed_at = now(), access_count = access_count + 1
    where id = v_link.id;

  select jsonb_build_object(
    'project', jsonb_build_object('id', v_project.id, 'name', v_project.name, 'description', v_project.description, 'color', v_project.color),
    'milestones', coalesce((
      select jsonb_agg(to_jsonb(m)) from public.milestones m
      join public.project_repos pr on pr.id = m.project_repo_id
      where pr.project_id = v_project.id and m.shared
    ), '[]'::jsonb),
    'issues', coalesce((
      select jsonb_agg(to_jsonb(i)) from public.issues i
      join public.project_repos pr on pr.id = i.project_repo_id
      where pr.project_id = v_project.id and i.shared
    ), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;

grant execute on function public.rotate_share_link(uuid, timestamptz) to authenticated;
grant execute on function public.revoke_share_link(uuid) to authenticated;
-- Intentionally public: the share page resolves a token with no account.
grant execute on function public.get_public_roadmap(text) to anon, authenticated;
