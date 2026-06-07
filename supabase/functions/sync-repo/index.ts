// sync-repo (#22): project a repo's milestones + issues into the Postgres cache.
//
// Backfill (no prior state) fetches everything; incremental uses `since` (issues) and an
// ETag/304 (milestones). Upserts are idempotent by (project_repo_id, number) and NEVER write
// `shared` -- the owner allowlist must survive every sync.
//
// Auth: a shared SYNC_TRIGGER_SECRET (the #24 cron passes it as a Bearer). Not owner-facing.
import { admin } from '../_shared/supabaseAdmin.ts'
import { installationToken, listIssues, listMilestones } from '../_shared/github.ts'
import { upsertIssues, upsertMilestones } from '../_shared/projection.ts'
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

  const { data: repo, error: repoErr } = await admin
    .from('project_repos')
    .select('id, owner, repo, installation_id')
    .eq('id', projectRepoId)
    .maybeSingle()
  if (repoErr) return jsonResponse({ error: 'project_repo lookup failed' }, 500)
  if (!repo) return jsonResponse({ error: 'project_repo not found' }, 404)

  const { data: state } = await admin
    .from('sync_state')
    .select('last_synced_at, last_etag')
    .eq('project_repo_id', projectRepoId)
    .maybeSingle()

  const token = await installationToken(repo.installation_id)
  // Use the START time as the next `since` so a change during this run is caught next time (safe overlap).
  const startedAt = new Date().toISOString()

  // --- Milestones (conditional on ETag) + Issues (incremental via `since`, PRs excluded) ---
  const ms = await listMilestones(token, repo.owner, repo.repo, state?.last_etag ?? null)
  const issues = await listIssues(token, repo.owner, repo.repo, state?.last_synced_at ?? null)
  let milestonesUpserted = 0
  let issuesUpserted = 0
  try {
    // Upsert milestones first so upsertIssues can resolve milestone linkage. Both omit `shared`.
    if (!ms.notModified) milestonesUpserted = await upsertMilestones(admin, projectRepoId, ms.milestones, startedAt)
    issuesUpserted = await upsertIssues(admin, projectRepoId, issues, startedAt)
  } catch (e) {
    return jsonResponse({ error: e instanceof Error ? e.message : 'upsert failed' }, 500)
  }

  const { error: stateErr } = await admin
    .from('sync_state')
    .upsert({ project_repo_id: projectRepoId, last_synced_at: startedAt, last_etag: ms.etag }, { onConflict: 'project_repo_id' })
  if (stateErr) return jsonResponse({ error: `sync_state upsert failed: ${stateErr.message}` }, 500)

  // Counts only -- never log tokens.
  console.log(`sync-repo ${repo.owner}/${repo.repo}: milestones=${milestonesUpserted} issues=${issuesUpserted} (304=${ms.notModified})`)
  return jsonResponse({ milestonesUpserted, issuesUpserted, milestonesNotModified: ms.notModified })
})
