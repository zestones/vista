-- Dedupe guard (#35, AC2): block an accidental DUPLICATE submission - a double-click or a network
-- retry that lands an identical row (same submitter + project + title) within a short window. This is
-- a guard, not a rate-limit: only approved editor members can insert and the owner approve/deny gate
-- stands before GitHub, so distinct requests are never throttled - a client may file many in a row.
-- Bypasses seed/test inserts (no auth.uid()), mirroring stamp_submission_submitter. Uses auth.uid()
-- directly so it is independent of the stamp trigger's firing order.
create function public.guard_submission_dedupe() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and exists (
    select 1 from public.submissions s
    where s.submitted_by = auth.uid()
      and s.project_id = new.project_id
      and s.title = new.title
      and s.created_at > now() - interval '10 seconds'
  ) then
    raise exception 'duplicate submission' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger submissions_dedupe before insert on public.submissions
  for each row execute function public.guard_submission_dedupe();
