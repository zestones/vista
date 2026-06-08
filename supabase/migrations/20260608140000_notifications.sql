-- In-app notifications (#108). Trigger-fed and server-side: each key event inserts a row for the
-- RECIPIENT (owner / submitter / member). Read-own RLS; rows are created ONLY by the security-definer
-- triggers below (no client insert). Messages are rendered client-side from kind + data (the
-- recipient's language is unknown here). Email (#36) can later read these same events.
create type public.notification_kind as enum (
  'submission_received', 'submission_approved', 'submission_denied',
  'access_requested', 'access_approved', 'access_denied'
);

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  kind       public.notification_kind not null,
  data       jsonb not null default '{}',
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index on public.notifications (user_id, created_at desc);

alter table public.notifications enable row level security;
create policy notifications_read on public.notifications for select using (user_id = auth.uid());
create policy notifications_update on public.notifications for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Insert a notification, skipping self-notification (the actor never notifies themselves).
create function public.notify(p_user uuid, p_project uuid, p_kind public.notification_kind, p_data jsonb, p_link text)
  returns void language plpgsql security definer set search_path = '' as $$
begin
  if p_user is null or p_user = auth.uid() then return; end if;
  insert into public.notifications (user_id, project_id, kind, data, link) values (p_user, p_project, p_kind, p_data, p_link);
end $$;

-- Submissions: new request -> owner; decided -> submitter.
create function public.on_submission_notify() returns trigger
  language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid;
  v_project text;
begin
  select p.owner_id, p.name into v_owner, v_project from public.projects p where p.id = new.project_id;
  if tg_op = 'INSERT' then
    perform public.notify(v_owner, new.project_id, 'submission_received',
      jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id || '/settings');
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    if new.status = 'approved' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_approved',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id);
    elsif new.status = 'denied' then
      perform public.notify(new.submitted_by, new.project_id, 'submission_denied',
        jsonb_build_object('project', v_project, 'title', new.title), '/app/projects/' || new.project_id);
    end if;
  end if;
  return new;
end $$;
create trigger submissions_notify after insert or update on public.submissions for each row execute function public.on_submission_notify();

-- Members: access requested -> owner; approved -> member; denied (a pending row deleted) -> member.
create function public.on_member_notify() returns trigger
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
      jsonb_build_object('project', v_project, 'who', coalesce(new.name, new.email)), '/app/projects/' || new.project_id || '/settings');
  elsif tg_op = 'UPDATE' and old.status = 'pending' and new.status = 'active' then
    perform public.notify(new.user_id, new.project_id, 'access_approved', jsonb_build_object('project', v_project), '/app/projects/' || new.project_id);
  end if;
  return new;
end $$;
create trigger members_notify after insert or update or delete on public.project_members for each row execute function public.on_member_notify();
