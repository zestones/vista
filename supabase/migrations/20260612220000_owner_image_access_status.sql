-- Image-access status (#262): tell the owner whether they've already granted the classic OAuth token,
-- so the UI shows "connected" instead of re-prompting per project (the grant is account-wide). Returns
-- only a boolean about the CALLER -- no data leak. github_installations is RLS deny-all, hence a
-- SECURITY DEFINER check keyed on auth.uid().
create or replace function public.owner_has_image_access() returns boolean
  language sql security definer set search_path = '' stable as $$
  select exists (
    select 1 from public.github_installations
    where installed_by = auth.uid() and user_token_encrypted is not null
  );
$$;

revoke execute on function public.owner_has_image_access() from public, anon;
grant  execute on function public.owner_has_image_access() to authenticated;
