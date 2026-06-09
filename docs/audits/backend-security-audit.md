# Backend & database audit — security + clean code/structure

**Date:** 2026-06-10 · **Auditor:** Claude (read-only; code on `main` @ `673d6d1`)
**Surface:** 26 SQL migrations · 5 Edge Functions (+ `_shared`) · 9 client service domains · client env/bootstrap.

---

## Part 1 — Security

### Verdict at a glance

The security architecture is **fundamentally sound and unusually disciplined**: deny-all RLS with narrowly additive policies, every `SECURITY DEFINER` function sets `search_path = ''`, the service-role key exists only inside Edge Functions, webhook HMAC is verified over the raw body with a constant-time compare, cron secrets live in `supabase_vault` (never in committed migrations), submitter identity is stamped server-side, and the anon surface is exactly one intentional RPC returning public fields. No secrets are committed (`supabase/functions/.env` is gitignored and was never tracked).

Two real findings need fixing — one high, one medium.

### Findings

| ID | Severity | Finding | Evidence |
|---|---|---|---|
| S1 | **HIGH** | **`connect-installation` never proves the caller installed the App.** Any authenticated Vista user can claim an arbitrary `installation_id` (GitHub installation ids are global, enumerable integers): the function only checks the installation exists *for our App* (`getInstallation`), then writes `installed_by = caller`. First-come-wins (the unique constraint only helps after the legitimate owner linked). A successful claim lets the attacker list that installation's repos and attach them to their own project (`connect-repos` trusts `installed_by`), then sync **private repos' issues/milestones/comments** into their project. | `connect-installation/index.ts:36-49` (no caller↔account check); `connect-repos/index.ts` `availableRepos()` keyed on `installed_by` |
| S2 | **MEDIUM** | **`public.notify()` is callable by any authenticated user.** Every other sensitive RPC pairs `revoke … from public` + targeted grant; `notify()` has no revoke, returns `void` (so PostgREST exposes it), and is `SECURITY DEFINER`. Any logged-in user can insert arbitrary notifications — any `kind`, any `data`, any `link` — for **any** user id: spam and in-app phishing (the bell renders the message and navigates to `link`). | `20260608140000_notifications.sql:28-33` (no revoke; compare `20260607190000_share_rpcs.sql:50-55`) |
| S3 | LOW | **CORS defaults to `*`** when `APP_ORIGIN` is unset. JWT auth still gates everything, so this is defense-in-depth, but deployed envs must set `APP_ORIGIN`. | `_shared/cors.ts:3` |
| S4 | LOW | **`set_member_comment_access` lacks the explicit revoke/grant pair** the other owner-gated RPCs have. It *is* internally gated by `is_owner` (safe), but the hygiene is inconsistent — future RPCs copying it might not be internally gated. | `20260608190000_comment_access_rls.sql:44-52` |
| S5 | LOW | **`create-issue` rollback can clobber a concurrent deny.** The failure path resets `status='pending'` keyed on id only; if the owner denied in the meantime (client-side `setStatus('denied')`), the rollback resurrects the submission as pending. Condition the rollback on `status='approved'`. | `create-issue/index.ts:106` |
| S6 | INFO | Minor notes: `sync-repo` compares the trigger secret with `!==` (not constant-time — 48-char random secret, negligible); webhook has no replay protection (GitHub provides none; idempotent upserts make replays harmless); boolean RLS helpers (`is_owner` etc.) are publicly callable (no data exposure — probing only); the inbox join exposes `projects.owner_id` to submission authors (a bare UUID, negligible). | — |

### What's done right (worth keeping as invariants)

- **RLS**: enabled deny-all at table creation; policies are additive and per-concern (`base_rls_policies` → owner-read → allowlist member-read → per-member comment grant). The 3-gate allowlist (published AND active member AND `shared`, with milestone/issue coherence) is exactly the documented model.
- **`SECURITY DEFINER` discipline**: every definer function sets `search_path = ''` and schema-qualifies — no search-path hijack surface.
- **Server-only trust**: identity stamping (`stamp_submission_submitter`, ignoring client values), the dedupe guard, the atomic pending→approved claim in `create-issue`, owner re-checks server-side ("never trust the client" is actually applied).
- **Secrets**: vault for cron (`resync_all_repos` reads `vault.decrypted_secrets`, execute revoked from all client roles); GitHub App key imported once, tokens cached in memory, never logged or returned; `.env` ignored and never committed.
- **Webhook**: HMAC-SHA256 over the raw bytes before parsing, constant-time compare, 401 on failure, fan-out idempotent, never touches `shared`.
- **Anon surface**: exactly `get_project_by_token` (public fields only, revocable token, `available_on_vista` gate). Invite tokens are `crypto.randomUUID()` (122 bits).

### Recommended fixes (ordered)

1. **S1**: prove installer identity. The cleanest path: the post-install redirect carries `?code=` — exchange it via the GitHub App OAuth flow (`GITHUB_APP_CLIENT_ID`/`SECRET` are already provisioned in the env, currently unused) and verify the authenticated GitHub user matches the installation's account (or is an org admin of it) before writing `installed_by`. Interim mitigation: restrict `getInstallation` claims to installations whose `account.login` matches a GitHub login stored on the caller's profile, or queue links as "pending verification".
2. **S2**: `revoke execute on function public.notify(uuid, uuid, public.notification_kind, jsonb, text) from public, anon, authenticated;` — the notify triggers are `SECURITY DEFINER` themselves and keep working.
3. **S4**: add the same revoke/grant pair to `set_member_comment_access` for consistency.
4. **S5**: add `.eq('status','approved')` to the rollback update.
5. **S3**: document `APP_ORIGIN` as a required deploy variable (deploy checklist).

---

## Part 2 — Clean code / structure

### Verdict at a glance

The backend structure is coherent and pattern-stable: per-domain services with a DTO file and twin `mock`/`supabase` implementations behind `env.backend`; Edge Functions composed from `_shared` modules (cors / admin / github / projection / sync) with a uniform JSON error envelope; migrations are narrative (issue refs, idempotence notes, "source: vault doc" pointers) and additive. Indexes cover the hot paths (`projects(owner_id)`, `project_members(project_id|user_id)`, `submissions(project_id,status)`, `notifications(user_id,created_at desc)`, natural-key uniques on the projection).

### Findings

| ID | Type | Finding | Evidence |
|---|---|---|---|
| C1 | **Parity gap (the real one)** | **`get_projects_for_user` hardcodes `'progress': null`** — the mock computes real progress, so progress bars and the Overview "Overall progress" stat render in dev and silently vanish in production (visible in the owner's screenshots: no bars on `/app`). Either compute the aggregate in the RPC (join `project_repos` → count open/closed issues) or drop the UI affordance. | `20260607122045_wire_rpcs.sql:46` vs `projects.service.ts` (mock summaries) |
| C2 | Minor | `listOwnerInbox` filters `owner_id` client-side after an RLS-wide select; PostgREST can filter on the embedded relation (`projects.owner_id=eq.…`) server-side. Correctness is unaffected (RLS bounds the rows); it's a clarity/payload nit. | `submissions.service.ts:94` |
| C3 | Minor | `20260608120000_submission_submitter_default.sql` was superseded the same day by the trigger migration — harmless history, but the default-drop + trigger could have been one migration. Pattern note only. | migrations 120000/130000 |
| C4 | Minor | `notifications.link` stores frontend route strings in the DB, coupling schema to router shape (already bitten once: the `20260609140000` link-rewrite migration). The `kind`+`data` pair is already there — deriving links client-side would remove the coupling. | `notifications.sql`, `notification_links.sql`, `submission_inbox_link.sql` |
| C5 | Minor | Edge functions hand-roll input validation per route (`String(body.x ?? '')`). Fine at 5 functions; a tiny shared `requireFields` helper would cut repetition if more are added. | all `index.ts` |
| C6 | Note | Mock + supabase implementations co-live in one file per service (~100-200 lines). Consistent and readable today; if services keep growing, split `*.mock.ts` / `*.supabase.ts`. | `src/services/*/` |

### Structure strengths

- **One boundary, respected**: UI → hooks → services → (RLS-bounded PostgREST | RPCs | Edge). No component touches `supabase` directly; cross-feature imports go through feature barrels.
- **Projection isolation**: GitHub cache tables are written exclusively by service-role code paths; client writes simply don't exist for them, and syncs can never flip `shared`.
- **Realtime scoping**: only `submissions` + `notifications` + roadmap/access tables are in the publication, each with a documented reason; `replica identity full` only where filters need it.
- **Migrations as documentation**: every file says *why*, cites the issue and the vault doc — the schema history reads as a narrative. Keep this.

---

## Suggested issue carve-out

1. `[security][high] Verify installer identity in connect-installation (OAuth code exchange)` — S1
2. `[security][medium] Revoke client execute on public.notify (+ set_member_comment_access hygiene)` — S2 + S4
3. `[security][low] create-issue rollback must not clobber a concurrent deny; APP_ORIGIN deploy doc` — S5 + S3
4. `[backend] Compute real progress in get_projects_for_user (mock/prod parity)` — C1

> [!IMPORTANT]
> S1 should land before any external/multi-tenant beta: it is the one finding that crosses a tenant boundary. S2 is a quick migration. C1 is user-visible today (empty progress everywhere in prod).
