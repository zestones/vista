-- Request-loop notifications (#250/#125): close the loop in-app for the client. Notify the submitter on
-- meaningful status changes (needs info / delivered, in addition to approved/declined), and notify the
-- other party of every new thread message. notify() already skips self-notification.

alter type public.notification_kind add value if not exists 'submission_needs_info';
alter type public.notification_kind add value if not exists 'submission_delivered';
alter type public.notification_kind add value if not exists 'submission_message';
alter type public.notification_kind add value if not exists 'submission_under_review';
alter type public.notification_kind add value if not exists 'submission_in_progress';

-- Notify the submitter on EVERY status transition (the owner moving the request along its lifecycle).
create or replace function public.on_submission_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_project text;
  v_link text;
  v_kind public.notification_kind;
begin
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    perform public.notify(v_owner, new.project_id, 'submission_received',
      jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '/submissions');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    v_kind := case new.status
      when 'under_review' then 'submission_under_review'
      when 'needs_info' then 'submission_needs_info'
      when 'planned' then 'submission_approved'
      when 'in_progress' then 'submission_in_progress'
      when 'delivered' then 'submission_delivered'
      when 'declined' then 'submission_denied'
      else null
    end;
    if v_kind is not null then
      v_link := '/app/projects/' || new.project_id || '?tab=requests';
      perform public.notify(new.submitted_by, new.project_id, v_kind, jsonb_build_object('project', v_project, 'title', new.title), v_link);
    end if;
  end if;
  return new;
end $$;

-- New message -> notify the OTHER party (owner <-> submitter), linked to their view of the request.
create function public.on_submission_message_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_submitter uuid;
  v_project_id uuid;
  v_project text;
  v_title text;
  v_recipient uuid;
begin
  select s.project_id, s.submitted_by, s.title into v_project_id, v_submitter, v_title
    from public.submissions s where s.id = new.submission_id;
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = v_project_id;
  v_recipient := case when new.author_id = v_owner then v_submitter else v_owner end;
  perform public.notify(
    v_recipient, v_project_id, 'submission_message',
    jsonb_build_object('project', v_project, 'title', v_title),
    case when v_recipient = v_owner then '/app/projects/' || v_project_id || '/submissions' else '/app/projects/' || v_project_id || '?tab=requests' end
  );
  return new;
end $$;

create trigger submission_messages_notify after insert on public.submission_messages
  for each row execute function public.on_submission_message_notify();
