-- Record who submitted a request (#99). The insert never set submitted_by, so every row was NULL:
-- no traceability, and submissions_read (is_owner OR submitted_by = auth.uid()) hid a submitter's
-- own request from them. Default to the authenticated caller -- server-side and unspoofable; the
-- client keeps omitting the column. Insert is already gated to editor+ by RLS.
alter table public.submissions alter column submitted_by set default auth.uid();
