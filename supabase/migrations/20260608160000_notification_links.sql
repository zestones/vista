-- Deep-link notifications to the right tab (#37/#108 follow-up). The settings + roadmap pages now read
-- a `?tab=` query param, so each notification can land the recipient exactly where the action is:
-- owner -> the submissions/requests inbox tab; submitter -> their "My requests" tab. Only the link
-- strings change; trigger bindings are untouched (create or replace keeps them).
create or replace function public.on_submission_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_project text;
begin
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    perform public.notify(v_owner, new.project_id, 'submission_received',
      jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '/settings?tab=submissions');
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

create or replace function public.on_member_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_project text;
begin
  if tg_op = 'DELETE' then
    if old.status = 'pending' then
      select p.name into v_project from public.projects p where p.id = old.project_id;
      perform public.notify(old.user_id, old.project_id, 'access_denied', jsonb_build_object('project', v_project), '/app');
    end if;
    return old;
  end if;
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = new.project_id;
  if tg_op = 'INSERT' and new.status = 'pending' then
    perform public.notify(v_owner, new.project_id, 'access_requested',
      jsonb_build_object('project', v_project, 'who', coalesce(new.name, new.email)), '/app/projects/' || new.project_id || '/settings?tab=requests');
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' then
    perform public.notify(new.user_id, new.project_id, 'access_approved', jsonb_build_object('project', v_project), '/app/projects/' || new.project_id);
  end if;
  return new;
end $$;
