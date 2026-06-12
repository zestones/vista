-- Owner OAuth token storage (#262a): persist the installer's GitHub USER token so the sync can fetch
-- private-repo attachment images and re-host them (#262). #184 proved only a user token can read
-- `user-attachments` assets (installation tokens 404) and verified ownership, but DISCARDED the token.
-- Here we store it ENCRYPTED at rest (pgcrypto), keyed by a secret in supabase_vault -- same posture as
-- the sync secrets in 20260607170000_scheduled_resync.sql.
--
-- The encryption key is env-specific + SECRET, so it lives in vault and is set OUT OF BAND (never in
-- this committed migration):
--   select vault.create_secret('<32+ random bytes>', 'gh_token_enc_key');
--
-- github_installations is already RLS deny-all (20260607100418); these columns hold ciphertext only.

alter table github_installations
  add column if not exists user_token_encrypted   bytea,
  add column if not exists refresh_token_encrypted bytea,
  add column if not exists token_expires_at        timestamptz;

-- Store/refresh the installer's user token. SECURITY DEFINER so it can read the vault key; search_path
-- pinned to '' so every reference is schema-qualified (pgcrypto lives in `extensions`).
create or replace function public.store_installation_token(
  p_installation_id bigint, p_token text, p_refresh text, p_expires timestamptz
) returns void language plpgsql security definer set search_path = '' as $$
declare v_key text := (select decrypted_secret from vault.decrypted_secrets where name = 'gh_token_enc_key');
begin
  if v_key is null then raise exception 'gh_token_enc_key not set in vault'; end if;
  update public.github_installations
     set user_token_encrypted   = extensions.pgp_sym_encrypt(p_token, v_key),
         refresh_token_encrypted = case when p_refresh is null then null else extensions.pgp_sym_encrypt(p_refresh, v_key) end,
         token_expires_at        = p_expires
   where installation_id = p_installation_id;
end; $$;

-- Read back the decrypted token (server/service-role only). Returns no row if none stored.
create or replace function public.get_installation_token(p_installation_id bigint)
  returns table(token text, refresh_token text, expires_at timestamptz)
  language plpgsql security definer set search_path = '' as $$
declare v_key text := (select decrypted_secret from vault.decrypted_secrets where name = 'gh_token_enc_key');
begin
  if v_key is null then raise exception 'gh_token_enc_key not set in vault'; end if;
  return query
    select extensions.pgp_sym_decrypt(gi.user_token_encrypted, v_key),
           case when gi.refresh_token_encrypted is null then null
                else extensions.pgp_sym_decrypt(gi.refresh_token_encrypted, v_key) end,
           gi.token_expires_at
      from public.github_installations gi
     where gi.installation_id = p_installation_id
       and gi.user_token_encrypted is not null;
end; $$;

-- Deny the PostgREST client roles (anon/authenticated get explicit pg_default_acl grants -- revoking
-- from public alone is NOT enough, cf. the S2/S4 gotcha). The edge calls these via service_role, so
-- grant it back explicitly.
revoke execute on function public.store_installation_token(bigint, text, text, timestamptz) from public, anon, authenticated;
revoke execute on function public.get_installation_token(bigint) from public, anon, authenticated;
grant  execute on function public.store_installation_token(bigint, text, text, timestamptz) to service_role;
grant  execute on function public.get_installation_token(bigint) to service_role;
