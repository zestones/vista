# Backend & database — adversarial security audit (with live POCs)

**Date:** 2026-06-10 · **Auditor:** Claude · **Target:** local Vista stack (own infrastructure, authorized test)
**Method:** not code-reading alone — every finding was **attacked against the running Postgres** and verified by captured output.

> [!IMPORTANT]
> This supersedes the read-only audit. Each finding below has a **reproducible POC** and **real output**. Severities changed after testing: **S2 escalated MEDIUM → HIGH** (anon-exploitable). A systemic root cause (default `PUBLIC EXECUTE`) was found and is the parent of S2/S4.

---

## Methodology — why these proofs are faithful

PostgREST serves every browser request by setting `role authenticated` and `request.jwt.claims` from the bearer JWT; RLS then reads `auth.uid()` (= `claims->>'sub'`) and `auth.jwt()`. The harness reproduces that **exactly**, with no secret extraction and no GitHub dependency:

```sql
begin;
set local role authenticated;                      -- or 'anon' for unauthenticated
set local request.jwt.claims = '{"sub":"<uid>","email":"<e>","role":"authenticated"}';
<attack>;
rollback;                                           -- no state persists; tests are non-destructive
```

Verified the harness drives identity correctly: `current_user=authenticated`, `auth.uid()=<uid>`, `auth.jwt()->>'email'=<e>`.

**Environment (real):** docker `supabase_db_vista` (Postgres 17), **all 26 migrations applied**, real data (6 projects, 10 profiles, 19 submissions, 536 issues). **Tenants used:** Victim **A** = `idrissbenguezzou@gmail.com` (`8e8fe03c…`, owns 5 projects incl. private *Monstrun*/*Videmo*); Attacker **B** = `zeronimeg@gmail.com` (`900a8043…`, viewer on ARIA, editor on Vista, owner of *test*, **outsider to Monstrun**).

---

## Scoreboard

| Class | Tests | Result |
|---|---|---|
| Cross-tenant reads (private project, members, profiles/PII, notifications, submissions, issues, allowlist) | 9 | **9/9 blocked** |
| Writes / privilege escalation (priv-esc, takeover, moderation hijack, injection, join-private, forge-notif, mint-invite) | 7 | **7/7 blocked** |
| Owner-gated RPC cross-tenant calls (`set_project_shared`, `set_issue_shared`, `set_member_comment_access`) | 3 | **3/3 `forbidden`** |
| Anti-spoofing / injection / anon token surface | 3 | **3/3 secure** |
| **Exploits that SUCCEEDED** | — | **S2 (notify) authenticated + anon** |

The data plane (RLS) is **genuinely solid**. The two real holes are in the **function/grant layer** and one **edge-function authorization gap**.

---

## FINDINGS

### S2 — `notify()` lets ANY caller (incl. unauthenticated) write to any user's notification bell — **HIGH**

**Root cause:** `notify()` is `SECURITY DEFINER` (bypasses RLS) and the migration never revoked the default `PUBLIC EXECUTE`. It has no authorization beyond "don't self-notify". `kind`, `data`, and **`link`** are attacker-controlled; the bell renders the message and navigates to `link` → **in-app phishing + spam at scale**.

**POC (authenticated attacker B → victim A):**
```sql
begin;
select count(*) from public.notifications where user_id='8e8fe03c-…';        -- before
set local role authenticated;
set local request.jwt.claims = '{"sub":"900a8043-…","role":"authenticated"}';
select public.notify('8e8fe03c-…'::uuid, null, 'access_approved',
  '{"who":"IT"}'::jsonb, 'https://evil.example/credential-harvest');
reset role;
select count(*), bool_or(link='https://evil.example/credential-harvest')
from public.notifications where user_id='8e8fe03c-…';                        -- after
rollback;
```
**Captured output:** `before_count=12` → `after_count=13`, `phish_link_present=t`. The same write was **blocked** as a direct `INSERT` (see T2.6: `new row violates row-level security policy`) — the definer RPC bypasses that RLS.

**Escalation — anon (no login at all):**
```
anon_can_execute_notify = t
ANON notify() → before=12, after=13, anon_phish_present=t
```
Because the anon key ships in the client bundle, **an unauthenticated attacker can flood/phish any user's bell**. This is why severity is HIGH, not MEDIUM.

**Fix (one migration):**
```sql
revoke execute on function public.notify(uuid,uuid,public.notification_kind,jsonb,text) from public, anon, authenticated;
```
The notify-triggers are `SECURITY DEFINER` and keep working (they don't rely on the caller's execute grant).

---

### S1 — `connect-installation` binds a GitHub installation to the caller with NO ownership check — **HIGH (conditional)**

**Claim:** any authenticated user can claim an `installation_id` they don't own; `connect-repos` then mints tokens for it (keyed on `installed_by`) and syncs its **private** issues/milestones/comments into the attacker's project.

**Code path (`connect-installation/index.ts`):** `requireUser` (any logged-in user) → `getInstallation(id)` (verifies the install exists *for our App*, **not** that the caller owns it) → `insert github_installations(installation_id, account_login, installed_by = caller)`.

**POC — reproduce the exact service-role insert the function performs, for an attacker caller:**
```sql
begin;
insert into public.github_installations(installation_id, account_login, installed_by)
values (999999, 'some-victim-org', '900a8043-…');   -- attacker B
select installation_id, account_login, installed_by from public.github_installations where installation_id=999999;
rollback;
```
**Captured output:** `INSERT 0 1`; row `999999 | some-victim-org | 900a8043-…` — an arbitrary org's installation is now owned by the attacker in the DB. `connect-repos.availableRepos()` selects installs `where installed_by = caller` and mints a token per install → attacker gains that installation's private repos.

**Honest scope:** a *live HTTP* exploit additionally needs (a) any Vista JWT (free signup), (b) a real `installation_id` of our App (sequential integers — enumerable) that is **not yet linked** (the `unique(installation_id)` returns 409 "already linked to another account" once a legit owner links it — so the window is *existing-but-unlinked* installations, e.g. install→redirect race, or an attacker installing then linking before the victim). I proved the missing check + the writeable state + the downstream trust chain; I did not mint a GitHub installation. Still HIGH: it crosses a tenant boundary to private source data.

**Fix:** prove installer identity via the GitHub App OAuth `?code=` exchange (the redirect already carries it; `GITHUB_APP_CLIENT_ID/SECRET` are provisioned and currently unused) — verify the authenticated GitHub user owns/admins the installation's `account` before writing `installed_by`.

---

### S4 (reframed) — Systemic: `SECURITY DEFINER` functions default to `PUBLIC EXECUTE`; the revoke/grant pattern is applied inconsistently — **MEDIUM**

**Evidence — every definer function and who can execute it:**

| Executable by anon+authenticated, **no internal gate** | Status |
|---|---|
| `notify` | **EXPLOITABLE (S2)** |
| `request_access` | anon-call blocked only by `email` NOT NULL (POC: `null value in column "email"… violates not-null`) — **fragile** |
| `create_project` | anon-call blocked only by `owner_id` NOT NULL (POC: `… "owner_id" … violates not-null`) — **fragile** |
| `get_projects_for_user`, `get_project_by_token` | `auth.uid()`-scoped / token-gated → return empty/public; safe |
| trigger fns (`stamp_submission_submitter`, `on_submission_notify`, `handle_new_user`, …) | require trigger context; direct call errors; hygiene only |
| `is_owner`, `has_role`, `is_*`, `member_can_view_comments` | boolean self-helpers about `auth.uid()`; no data exposure |

`set_*` family + `claim_memberships` + `resync_all_repos` correctly `revoke … from public` (the latter two show `anon=f, authenticated=f`). The internally-gated `set_*` RPCs reject cross-tenant calls — **proven**: `set_project_shared`/`set_issue_shared`/`set_member_comment_access` on victim objects all raised `ERROR: forbidden` (errcode 42501).

**Why MEDIUM:** today only `notify` is live-exploitable; `request_access`/`create_project` are saved by NOT NULL **by accident** (a future nullable column reopens anon spam). The robust fix is systemic, not per-function.

**Fix:** add to a hardening migration —
```sql
revoke execute on all functions in schema public from public;        -- default deny
-- then grant explicitly only what the client needs:
grant execute on function public.create_project(...)        to authenticated;
grant execute on function public.get_projects_for_user()    to authenticated;
grant execute on function public.get_project_by_token(text)  to anon, authenticated;
grant execute on function public.request_access(text)        to authenticated;  -- + add an auth.uid() not-null guard
grant execute on function public.set_project_shared(...)     to authenticated;  -- (already)
-- … the set_* family … ; leave notify/trigger fns ungranted.
```

---

### S5 — `create-issue` rollback can resurrect a concurrently-denied submission — **LOW** (code-reasoned)
On GitHub failure the function resets `status='pending'` keyed on id only (`create-issue/index.ts:106`). If the owner denied meanwhile, the rollback flips it back to pending. **Fix:** `.eq('status','approved')` on the rollback update. (Not live-tested — requires the edge runtime + induced concurrency.)

### S3 — CORS defaults to `*` when `APP_ORIGIN` unset — **LOW**
`_shared/cors.ts:3`. JWT auth still gates everything; defense-in-depth. **Fix:** require `APP_ORIGIN` in the deploy checklist.

### S6 — Informational
`sync-repo` secret compared with `!==` (not constant-time; 48-char random → negligible) · webhook has no replay protection (idempotent upserts make replays harmless) · inbox join exposes `projects.owner_id` (a bare UUID) to submission authors.

---

## What is provably secure (regression baseline)

> [!NOTE]
> These are not assertions — they are captured negative results. Keep them as invariants.

- **Cross-tenant reads, 9/9 blocked.** Outsider B reading victim's private *Monstrun*: project `0`, members `0`, issues `0`. Other users' **profiles/emails**: `0` rows (PII protected). Victim **notifications**: `0`. Victim **submissions** (B as viewer on ARIA, and as editor on Vista): `0` others leaked. **Allowlist gate** (B viewer on ARIA): `232` shared issues seen, **`0` unshared leaked**.
- **Writes/escalation, 7/7 blocked.** viewer→owner priv-esc `UPDATE 0`; project takeover `UPDATE 0`; **moderation hijack** (approve someone else's submission) `UPDATE 0`; submission injection / join-private / forge-notification / mint-invite all `new row violates row-level security policy`.
- **Owner-gated RPCs, 3/3 `forbidden`** on cross-tenant targets.
- **Anti-spoofing works:** B inserting a submission with forged `submitter_email=victim` is stamped back to B's real identity by `stamp_submission_submitter` (`submitted_by/name/email = zeronimeg`).
- **Anon token surface tight:** `get_project_by_token` returns only `id,name,description,color,member_count` — no `owner_id`/`visibility`/`available_on_vista`.
- **Injection surface nil:** `0` definer functions use dynamic SQL (`EXECUTE`/`format`); all RPCs are parameterized plpgsql.
- **Co-member isolation:** editor B on Vista sees its own 8 submissions, `0` of the owner's.

Architecture strengths that produced this: deny-all RLS with additive per-concern policies; every definer fn sets `search_path=''`; service-role key confined to Edge Functions; webhook HMAC over raw body + constant-time compare; cron secret in `supabase_vault`; server-side identity stamping + atomic approve claim; invite tokens `crypto.randomUUID()` (122-bit).

---

## C1 — Clean-code/UX (not security): `get_projects_for_user()` hardcodes `progress: null`

**POC (as owner A):** `jsonb_path_query_array(get_projects_for_user(), '$.owned[*].progress')` → **`[null, null, null, null, null]`**. The mock computes real progress, so progress bars + the Overview "Overall progress" stat work in dev and are **empty in production** (matches the screenshots). **Fix:** compute the aggregate in the RPC (join `project_repos`→count open/closed issues) or drop the affordance.

---

## Remediation plan (priority order)

| # | Fix | Effort | Why now |
|---|---|---|---|
| 1 | **S2** revoke execute on `notify()` from public/anon/authenticated | 1-line migration | Live, anon-exploitable phishing/spam |
| 2 | **S1** verify installer identity (OAuth code exchange) in `connect-installation` | edge fn + flow | Crosses tenant boundary to private repos; do before any external beta |
| 3 | **S4** systemic `revoke execute … from public` + explicit grants; add `auth.uid()` guard to `request_access` | 1 migration | Removes the fragile "saved by NOT NULL" class |
| 4 | **C1** real progress in `get_projects_for_user` | RPC edit | User-visible everywhere in prod |
| 5 | **S5** `.eq('status','approved')` rollback guard; **S3** require `APP_ORIGIN` | small | Hardening |

> [!IMPORTANT]
> Suggested issues: `[security][high] revoke notify() execute (S2)` · `[security][high] verify installer identity in connect-installation (S1)` · `[security][medium] default-deny EXECUTE on public functions + request_access guard (S4)` · `[backend] real progress in get_projects_for_user (C1)`.
