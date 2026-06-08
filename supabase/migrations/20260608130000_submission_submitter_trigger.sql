-- Verified submitter identity (#99 revised). The column default let a client still send a fake
-- submitter_name/email. Owners can't read other profiles (profiles_read_self), so we denormalize
-- the identity server-side: a BEFORE INSERT trigger stamps submitted_by + submitter_name/email from
-- the caller's profile, ignoring any client-supplied values. Supersedes the default from 20260608120000.
alter table public.submissions alter column submitted_by drop default;

create function public.stamp_submission_submitter() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  -- Authenticated inserts only (RLS already gates to editor+). Superuser/seed inserts (no auth.uid())
  -- keep their provided values, so existing tests/fixtures are unaffected.
  if auth.uid() is not null then
    new.submitted_by := auth.uid();
    select p.email, coalesce(nullif(p.name, ''), split_part(p.email, '@', 1))
      into new.submitter_email, new.submitter_name
      from public.profiles p where p.id = auth.uid();
  end if;
  return new;
end $$;

create trigger submissions_stamp_submitter before insert on public.submissions
  for each row execute function public.stamp_submission_submitter();

-- Backfill: replace self-reported names/emails with the verified profile for rows that have a submitter.
update public.submissions s set
  submitter_email = p.email,
  submitter_name = coalesce(nullif(p.name, ''), split_part(p.email, '@', 1))
from public.profiles p
where p.id = s.submitted_by;
