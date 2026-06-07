-- Core schema (#11): the Phase 2 collaboration tables.
-- Source of truth: vault "Architecture/Modèle de données.md".
-- The GitHub projection (github_installations, project_repos, milestones, issues,
-- sync_state) is Phase 3. RLS is ENABLED here (deny-all) but policies land in #14.
-- The profiles INSERT trigger (handle_new_user) lands in #12.

-- ─── Enums ───────────────────────────────────────────────────────
create type project_visibility as enum ('private', 'shared');
create type member_role        as enum ('owner', 'editor', 'viewer');
create type member_status      as enum ('pending', 'active');
create type submission_type    as enum ('feature', 'bug', 'question', 'other');
create type submission_status  as enum ('pending', 'approved', 'denied');

-- ─── profiles ────────────────────────────────────────────────────
-- Mirror of auth.users (one row per user). The populating trigger is #12.
create table profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text,
  avatar_url text,
  created_at timestamptz not null default now()
);

-- ─── projects ────────────────────────────────────────────────────
create table projects (
  id                 uuid primary key default gen_random_uuid(),
  owner_id           uuid not null references profiles (id) on delete cascade,
  name               text not null,
  description        text default '',
  color              text,
  visibility         project_visibility not null default 'private',
  available_on_vista boolean not null default true,
  created_at         timestamptz not null default now()
);
create index on projects (owner_id);

-- ─── project_members ─────────────────────────────────────────────
-- A member can exist before having an account (invited by email):
-- user_id is nullable and resolved at login (#13).
create table project_members (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  user_id    uuid references profiles (id) on delete set null,
  email      text not null,
  name       text,
  role       member_role   not null default 'viewer',
  status     member_status not null default 'pending',
  invited_at timestamptz not null default now(),
  decided_at timestamptz,
  unique (project_id, email)
);
create index on project_members (project_id);
create index on project_members (user_id);

-- ─── project_invites ─────────────────────────────────────────────
-- Rotatable, revocable share-link token (resolved by the RPC in #16).
create table project_invites (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects (id) on delete cascade,
  token      text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

-- ─── submissions (moderation queue) ──────────────────────────────
-- github_repo_id (FK -> project_repos) is deferred to Phase 3/5 when that table exists.
create table submissions (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid not null references projects (id) on delete cascade,
  type                submission_type   not null default 'feature',
  title               text not null,
  body                text default '',
  submitted_by        uuid references profiles (id) on delete set null,
  submitter_name      text,
  submitter_email     text,
  status              submission_status not null default 'pending',
  github_issue_number int,
  created_at          timestamptz not null default now(),
  decided_at          timestamptz,
  decided_by          uuid references profiles (id)
);
create index on submissions (project_id, status);

-- ─── RLS: enable deny-all now; policies are added in #14 ──────────
alter table profiles        enable row level security;
alter table projects        enable row level security;
alter table project_members enable row level security;
alter table project_invites enable row level security;
alter table submissions     enable row level security;
