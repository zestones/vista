-- Attachment re-hosting (#262b): a public Storage bucket for GitHub private-repo attachment images,
-- plus a dedup map. The sync fetches each `user-attachments` asset with the owner token (#262a) and
-- uploads it here so Vista clients (not GitHub collaborators) can actually load it.
--
-- Bucket is PUBLIC with unguessable paths (the asset UUID): an <img> sends no auth header, so a gated
-- proxy is impractical; a leak requires an already-authorized viewer to share the exact URL (they can
-- already exfiltrate the image). Decision recorded in the #262 plan.

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

-- Dedup map: asset_key = the `user-attachments/assets/<uuid>` UUID (globally unique -> shared across
-- repos/projects). storage_path is the object key within the bucket. RLS deny-all; only the service
-- role (sync/webhook) writes, and reads happen over the bucket's public URL, not this table.
create table github_attachments (
  asset_key    text primary key,
  storage_path text not null,
  content_type text,
  byte_size    int,
  created_at   timestamptz not null default now()
);
alter table github_attachments enable row level security;
