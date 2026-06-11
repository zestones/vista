-- Request loop v2 — foundation (#249/#125): a discussion thread on submissions + a rich status
-- lifecycle. Source: epic #125. The owner and the client converse before/after a decision, and the
-- status carries more than approve/deny.

-- ─── Rich status lifecycle ───────────────────────────────────────
-- Replace the 3-state enum with the full lifecycle. Migrate existing rows:
-- pending -> received, approved -> planned, denied -> declined.
alter type public.submission_status rename to submission_status_old;
create type public.submission_status as enum (
  'received', 'under_review', 'needs_info', 'planned', 'in_progress', 'delivered', 'declined'
);
alter table public.submissions alter column status drop default;
alter table public.submissions
  alter column status type public.submission_status using (
    case status::text
      when 'pending' then 'received'
      when 'approved' then 'planned'
      when 'denied' then 'declined'
      else 'received'
    end::public.submission_status
  );
alter table public.submissions alter column status set default 'received';
drop type public.submission_status_old;

-- ─── Discussion thread ───────────────────────────────────────────
-- Client-writable (unlike the GitHub comments projection). Identity is server-stamped (#99 pattern).
create table public.submission_messages (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions (id) on delete cascade,
  author_id     uuid references public.profiles (id) on delete set null,
  author_name   text,
  author_email  text,
  body          text not null,
  created_at    timestamptz not null default now()
);
create index on public.submission_messages (submission_id);

alter table public.submission_messages enable row level security;

-- Read: the submission's author, or the project owner.
create policy submission_messages_read on public.submission_messages for select
  using (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and (s.submitted_by = auth.uid() or public.is_owner(s.project_id))
    )
  );

-- Insert: the submission's author or the project owner; author_id must be the caller (stamped below).
create policy submission_messages_insert on public.submission_messages for insert
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and (s.submitted_by = auth.uid() or public.is_owner(s.project_id))
    )
  );

-- Stamp the author from the caller's profile (mirror stamp_submission_submitter, #99).
create function public.stamp_submission_message_author() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null then
    new.author_id := auth.uid();
    select p.email, coalesce(nullif(p.name, ''), split_part(p.email, '@', 1))
      into new.author_email, new.author_name
      from public.profiles p where p.id = auth.uid();
  end if;
  return new;
end $$;

create trigger submission_messages_stamp_author before insert on public.submission_messages
  for each row execute function public.stamp_submission_message_author();

-- Realtime so a new message / status change appears live (#37/#122). RLS still scopes recipients.
alter table public.submission_messages replica identity full;
alter publication supabase_realtime add table public.submission_messages;

-- ─── Fix the status-change notifier for the new lifecycle ─────────
-- on_submission_notify (last defined in 20260608160000) hard-codes the old 'approved'/'denied' enum
-- values; after the migration those literals no longer cast, so EVERY status update would error. Remap
-- to the lifecycle: notify the client when a request becomes 'planned' (approved) or 'declined'.
create or replace function public.on_submission_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_project text;
begin
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    perform public.notify(v_owner, new.project_id, 'submission_received',
      jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '/submissions');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'planned' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_approved',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '?tab=requests');
    elsif new.status = 'declined' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_denied',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '?tab=requests');
    end if;
  end if;
  return new;
end $$;
