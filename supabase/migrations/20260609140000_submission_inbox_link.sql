-- Submissions moved to their own surface (#143, part of #136): the moderation inbox left project
-- settings, so a `submission_received` notification now deep-links to /app/projects/:id/submissions
-- (was /settings?tab=submissions). Only that link string changes; trigger bindings are untouched.
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
    if new.status = 'approved' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_approved',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '?tab=requests');
    elsif new.status = 'denied' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_denied',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '?tab=requests');
    end if;
  end if;
  return new;
end $$;
