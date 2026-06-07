// sync-repo (#22): project a repo's milestones + issues into the Postgres cache.
//
// Backfill (no prior state) fetches everything; incremental uses `since` (issues) and an
// ETag/304 (milestones). Upserts are idempotent by (project_repo_id, number) and NEVER write
// `shared` -- the owner allowlist must survive every sync.
//
// Auth: a shared SYNC_TRIGGER_SECRET (the #24 cron passes it as a Bearer). Not owner-facing.
import { admin } from '../_shared/supabaseAdmin.ts'
import { installationToken, listIssues, listMilestones } from '../_shared/github.ts'
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

  // --- Milestones (conditional on ETag) ---
  const ms = await listMilestones(token, repo.owner, repo.repo, state?.last_etag ?? null)
  let milestonesUpserted = 0
  if (!ms.notModified && ms.milestones.length > 0) {
    const rows = ms.milestones.map((m) => ({
      project_repo_id: projectRepoId,
      number: m.number,
      title: m.title,
      description: m.description,
      due_on: m.due_on,
      state: m.state,
      open_issues: m.open_issues,
      closed_issues: m.closed_issues,
      updated_at: startedAt,
    }))
    const { error } = await admin.from('milestones').upsert(rows, { onConflict: 'project_repo_id,number' })
    if (error) return jsonResponse({ error: `milestone upsert failed: ${error.message}` }, 500)
    milestonesUpserted = rows.length
  }

  // Map milestone number -> id for issue linkage.
  const { data: msRows } = await admin.from('milestones').select('id, number').eq('project_repo_id', projectRepoId)
  const msByNumber = new Map<number, string>((msRows ?? []).map((m) => [m.number, m.id]))

  // --- Issues (incremental via `since`), PRs already excluded by the helper ---
  const issues = await listIssues(token, repo.owner, repo.repo, state?.last_synced_at ?? null)
  let issuesUpserted = 0
  if (issues.length > 0) {
    const rows = issues.map((i) => ({
      project_repo_id: projectRepoId,
      number: i.number,
      title: i.title,
      state: i.state,
      labels: i.labels.map((l) => (typeof l === 'string' ? l : l.name)),
      author_login: i.user?.login ?? null,
      author_avatar_url: i.user?.avatar_url ?? null,
      html_url: i.html_url,
      created_at: i.created_at,
      closed_at: i.closed_at,
      milestone_id: i.milestone ? (msByNumber.get(i.milestone.number) ?? null) : null,
      updated_at: startedAt,
    }))
    const { error } = await admin.from('issues').upsert(rows, { onConflict: 'project_repo_id,number' })
    if (error) return jsonResponse({ error: `issue upsert failed: ${error.message}` }, 500)
    issuesUpserted = rows.length
  }

  const { error: stateErr } = await admin
    .from('sync_state')
    .upsert({ project_repo_id: projectRepoId, last_synced_at: startedAt, last_etag: ms.etag }, { onConflict: 'project_repo_id' })
  if (stateErr) return jsonResponse({ error: `sync_state upsert failed: ${stateErr.message}` }, 500)

  // Counts only -- never log tokens.
  console.log(`sync-repo ${repo.owner}/${repo.repo}: milestones=${milestonesUpserted} issues=${issuesUpserted} (304=${ms.notModified})`)
  return jsonResponse({ milestonesUpserted, issuesUpserted, milestonesNotModified: ms.notModified })
})
