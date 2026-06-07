-- Give every project a signature color (#6). create_project never set one, so supabase-created
-- projects rendered with the ink fallback (black dot). Assign from the same palette the mock uses
-- (src/lib/mock/seed.ts PROJECT_PALETTE), cycled by project count, and backfill existing nulls.

create or replace function public.create_project(
  p_name text, p_description text, p_visibility public.project_visibility, p_available boolean
) returns public.projects
  language plpgsql security definer set search_path = '' as $$
declare
  v_project public.projects;
  v_email text := auth.jwt() ->> 'email';
  v_palette text[] := array['#aa2d00', '#1b61c9', '#0a2e0e', '#d9a441'];
  v_color text := v_palette[1 + ((select count(*) from public.projects)::int % array_length(v_palette, 1))];
begin
  insert into public.projects (owner_id, name, description, color, visibility, available_on_vista)
  values (auth.uid(), p_name, nullif(p_description, ''), v_color, p_visibility, p_available)
  returning * into v_project;

  insert into public.project_members (project_id, user_id, email, name, role, status)
  values (v_project.id, auth.uid(), v_email, coalesce(auth.jwt() ->> 'name', split_part(v_email, '@', 1)), 'owner', 'active');

  return v_project;
end $$;

-- Backfill: deterministic by creation order so existing projects each get a distinct color.
with ranked as (
  select id, (array['#aa2d00', '#1b61c9', '#0a2e0e', '#d9a441'])[1 + ((row_number() over (order by created_at) - 1)::int % 4)] as color
  from public.projects
  where color is null
)
update public.projects p set color = r.color from ranked r where p.id = r.id;
