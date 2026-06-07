-- Auth -> profiles sync (#12): create a profile row whenever a user signs up.
-- Source: vault "Architecture/Backend (Supabase)/Authentification & sessions.md".
-- security definer + empty search_path (schema-qualified) to avoid search_path hijacking.
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
