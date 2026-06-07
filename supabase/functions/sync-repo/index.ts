// sync-repo (#22): project a repo's milestones + issues into the Postgres cache.
//
// Backfill (no prior state) fetches everything; incremental uses `since` (issues) and an
// ETag/304 (milestones). Upserts are idempotent by (project_repo_id, number) and NEVER write
// `shared` -- the owner allowlist must survive every sync.
//
// Auth: a shared SYNC_TRIGGER_SECRET (the #24 cron passes it as a Bearer). Not owner-facing.
import { admin } from '../_shared/supabaseAdmin.ts'
import { RepoNotFoundError, syncRepo } from '../_shared/sync.ts'
import { jsonResponse, preflight } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405)

  // Internal/cron only: require the shared trigger secret (the #24 cron passes it as a Bearer).
  const bearer = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  const secret = Deno.env.get('SYNC_TRIGGER_SECRET')
  if (!secret || bearer !== secret) return jsonResponse({ error: 'forbidden' }, 403)

  let projectRepoId: string
  try {
    const body = (await req.json()) as { project_repo_id?: unknown }
    projectRepoId = String(body.project_repo_id ?? '')
    if (!projectRepoId) throw new Error('missing')
  } catch {
    return jsonResponse({ error: 'project_repo_id required' }, 400)
  }

  try {
    return jsonResponse(await syncRepo(admin, projectRepoId))
  } catch (e) {
    if (e instanceof RepoNotFoundError) return jsonResponse({ error: e.message }, 404)
    return jsonResponse({ error: e instanceof Error ? e.message : 'sync failed' }, 500)
  }
})
