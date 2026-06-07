-- GitHub projection tables (#64): the read-model cache populated by the Phase 3 sync.
-- Pulled forward (Phase 2 milestone-audit decision) so `gen types` (#17) is complete
-- and VITE_BACKEND=supabase flips cleanly app-wide. These tables stay EMPTY until
-- the Phase 3 sync fills them. Source of truth: vault "Architecture/Modèle de données.md".
-- RLS is ENABLED deny-all here; the allowlist read policies land in Phase 4.

-- ─── github_installations ────────────────────────────────────────
-- One GitHub App installation, attached to the owner.
create table github_installations (
  id              uuid primary key default gen_random_uuid(),
  installation_id bigint not null unique,            -- GitHub's numeric id
  account_login   text not null,                     -- org/user where the App is installed
  installed_by    uuid not null references profiles (id) on delete cascade,
  created_at      timestamptz not null default now()
);

-- ─── project_repos ───────────────────────────────────────────────
-- Project <-> repo link (multi-repo). installation_id is NOT NULL: a repo link
-- always belongs to an installation (created during the Phase 3 connect flow).
create table project_repos (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references projects (id) on delete cascade,
  installation_id bigint not null references github_installations (installation_id) on delete cascade,
  owner           text not null,
  repo            text not null,
  github_repo_id  bigint,
  created_at      timestamptz not null default now(),
  unique (project_id, owner, repo)
);
create index on project_repos (project_id);

-- ─── milestones (projection + allowlist) ─────────────────────────
create table milestones (
  id              uuid primary key default gen_random_uuid(),
  project_repo_id uuid not null references project_repos (id) on delete cascade,
  number          int not null,                      -- GitHub number
  title           text not null,
  description     text,
  due_on          timestamptz,
  state           text,                              -- open|closed
  open_issues     int default 0,
  closed_issues   int default 0,
  shared          boolean not null default false,    -- ALLOWLIST
  updated_at      timestamptz not null default now(),
  unique (project_repo_id, number)
);

-- ─── issues (projection + allowlist) ─────────────────────────────
create table issues (
  id                uuid primary key default gen_random_uuid(),
  project_repo_id   uuid not null references project_repos (id) on delete cascade,
  milestone_id      uuid references milestones (id) on delete set null,
  number            int not null,
  title             text not null,
  state             text,                            -- open|closed
  labels            jsonb default '[]',
  author_login      text,
  author_avatar_url text,
  html_url          text,
  created_at        timestamptz,
  closed_at         timestamptz,
  shared            boolean not null default false,  -- ALLOWLIST
  updated_at        timestamptz not null default now(),
  unique (project_repo_id, number)
);
create index on issues (milestone_id);

-- ─── sync_state ──────────────────────────────────────────────────
-- Per-repo freshness tracking for the sync.
create table sync_state (
  project_repo_id uuid primary key references project_repos (id) on delete cascade,
  last_synced_at  timestamptz,
  last_etag       text
);

-- ─── updated_at trigger (projection tables only) ─────────────────
create function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger milestones_set_updated_at before update on milestones
  for each row execute function set_updated_at();
create trigger issues_set_updated_at before update on issues
  for each row execute function set_updated_at();

-- ─── RLS: enable deny-all now; allowlist read policies are Phase 4 ─
alter table github_installations enable row level security;
alter table project_repos        enable row level security;
alter table milestones           enable row level security;
alter table issues               enable row level security;
alter table sync_state           enable row level security;
