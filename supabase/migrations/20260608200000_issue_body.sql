-- Issue body (#119): store the issue description so the comment panel can show it as the opening post.
-- Visibility rides on the EXISTING issue read policies (owner-read #20, member-read #26): a shared issue
-- exposes its body to members who can see it; replies stay gated by can_view_comments (#91). No new RLS.
alter table public.issues add column body text;
