-- Bootstrap migration (#10): foundational extensions only.
-- The actual schema (profiles, projects, members, invites, submissions) lands in #11.
-- pgcrypto provides gen_random_uuid(), used by the upcoming tables' primary keys.
create extension if not exists pgcrypto with schema extensions;
