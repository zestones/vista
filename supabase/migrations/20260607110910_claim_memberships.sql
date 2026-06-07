-- Reconcile invitations by email (#13).
-- A member can be invited before having an account (project_members.user_id null, email known).
-- We link those rows to the user by their VERIFIED email, both at signup and at every login
-- (so someone invited AFTER they already signed up is still linked).

-- Links pending memberships for a verified email to the user. SECURITY DEFINER so it can update
-- rows the caller can't under RLS -- and NOT exposed as a client RPC (execute revoked below),
-- otherwise a client could claim another email's invites.
create function public.claim_memberships(p_uid uuid, p_email text) returns void
  language sql security definer set search_path = '' as $$
  update public.project_members
     set user_id = p_uid
   where user_id is null
     and lower(email) = lower(p_email);
$$;
revoke execute on function public.claim_memberships(uuid, text) from public, anon, authenticated;

-- Signup coverage: claim right after the profile is created (extends #12's handle_new_user).
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  perform public.claim_memberships(new.id, new.email);
  return new;
end;
$$;

-- Login coverage: claim again whenever the user actually signs in.
create function public.handle_user_login() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  perform public.claim_memberships(new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_login
  after update of last_sign_in_at on auth.users
  for each row
  when (new.last_sign_in_at is distinct from old.last_sign_in_at)
  execute function public.handle_user_login();
