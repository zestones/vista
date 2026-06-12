-- Organize projects (#275): pin (max 5 per owner), manual order, color. `color` already exists.
alter table projects
  add column if not exists pinned   boolean not null default false,
  add column if not exists position integer;

-- Cap: at most 5 pinned projects per owner. DB-enforced as defense-in-depth (the UI also gates it).
-- SECURITY DEFINER so the count is accurate regardless of RLS; search_path pinned, refs schema-qualified.
create or replace function public.enforce_pin_cap() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if new.pinned and (
    select count(*) from public.projects
    where owner_id = new.owner_id and pinned and id <> new.id
  ) >= 5 then
    raise exception 'pin limit reached (max 5 pinned projects)';
  end if;
  return new;
end; $$;

drop trigger if exists trg_enforce_pin_cap on public.projects;
create trigger trg_enforce_pin_cap before insert or update on public.projects
  for each row when (new.pinned) execute function public.enforce_pin_cap();

-- Reorder: set `position` by array index, scoped to the caller's OWN projects (owner-only). One atomic call.
create or replace function public.reorder_projects(p_ids uuid[]) returns void
  language plpgsql security definer set search_path = '' as $$
begin
  update public.projects p
     set position = idx.ord
    from (select t.id, (t.ord - 1)::int as ord from unnest(p_ids) with ordinality as t(id, ord)) idx
   where p.id = idx.id and p.owner_id = auth.uid();
end; $$;

revoke execute on function public.reorder_projects(uuid[]) from public, anon;
grant  execute on function public.reorder_projects(uuid[]) to authenticated;
