// create-issue (#32): on owner approval, turn a client submission into a real GitHub issue.
//
// Owner-gated server-side (never trust the client). Idempotent: an atomic pending->approved
// claim ensures exactly one create even under concurrent approvals; a GitHub failure rolls the
// claim back so the owner can retry. The created issue returns via sync, private by default.
// Source: Architecture/Backend (Supabase)/Pipeline de modération.
import { admin, requireUser, UnauthorizedError } from '../_shared/supabaseAdmin.ts'
import { createIssue, installationToken } from '../_shared/github.ts'
import { jsonResponse, preflight } from '../_shared/cors.ts'

interface RepoRow {
  id: string
  owner: string
  repo: string
  installation_id: number
}

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405)

  let userId: string
  try {
    userId = (await requireUser(req)).id
  } catch (e) {
    return jsonResponse({ error: e instanceof UnauthorizedError ? e.message : 'unauthorized' }, 401)
  }

  let submissionId: string
  let projectRepoId: string | null
  let milestoneNumber: number | null
  try {
    const body = (await req.json()) as { submission_id?: unknown; project_repo_id?: unknown; milestone_number?: unknown }
    submissionId = String(body.submission_id ?? '')
    projectRepoId = body.project_repo_id != null ? String(body.project_repo_id) : null
    milestoneNumber = body.milestone_number != null ? Number(body.milestone_number) : null
    if (!submissionId) throw new Error('missing')
  } catch {
    return jsonResponse({ error: 'submission_id required' }, 400)
  }

  // Load the submission.
  const { data: sub, error: subErr } = await admin
    .from('submissions')
    .select('id, project_id, type, title, body, submitter_name, submitter_email, status, github_issue_number')
    .eq('id', submissionId)
    .maybeSingle()
  if (subErr) return jsonResponse({ error: 'submission lookup failed' }, 500)
  if (!sub) return jsonResponse({ error: 'submission not found' }, 404)
  if (sub.github_issue_number != null) return jsonResponse({ error: 'already created', github_issue_number: sub.github_issue_number }, 409)
  // "Undecided" = the review group of the lifecycle (#249); approve flips it to 'planned'.
  const REVIEW = ['received', 'under_review', 'needs_info']
  if (!REVIEW.includes(sub.status)) return jsonResponse({ error: 'submission is not awaiting a decision' }, 409)

  // Owner re-check (never trust the client).
  const { data: project } = await admin.from('projects').select('id').eq('id', sub.project_id).eq('owner_id', userId).maybeSingle()
  if (!project) return jsonResponse({ error: 'not your project' }, 403)

  // Resolve the target repo: explicit id (validated against the project) or the project's sole repo.
  let repo: RepoRow
  if (projectRepoId) {
    const { data } = await admin
      .from('project_repos')
      .select('id, owner, repo, installation_id')
      .eq('id', projectRepoId)
      .eq('project_id', sub.project_id)
      .maybeSingle()
    if (!data) return jsonResponse({ error: 'repo not in this project' }, 422)
    repo = data
  } else {
    const { data: repos } = await admin.from('project_repos').select('id, owner, repo, installation_id').eq('project_id', sub.project_id)
    if (!repos || repos.length === 0) return jsonResponse({ error: 'no repo attached to this project' }, 422)
    if (repos.length > 1) return jsonResponse({ error: 'multiple repos: choose a target repo', code: 'choose_repo' }, 409)
    repo = repos[0]
  }

  // Atomic claim: only one approval flips an undecided submission -> planned while still uncreated.
  const now = new Date().toISOString()
  const { data: claimed } = await admin
    .from('submissions')
    .update({ status: 'planned', decided_by: userId, decided_at: now })
    .eq('id', submissionId)
    .in('status', REVIEW)
    .is('github_issue_number', null)
    .select('id')
    .maybeSingle()
  if (!claimed) return jsonResponse({ error: 'already processed' }, 409)

  // Create the issue. On failure, roll the claim back so the owner can retry.
  const title = `[${sub.type}] ${sub.title}`
  const attribution = sub.submitter_name ?? sub.submitter_email ?? 'client'
  const issueBody = `${sub.body ?? ''}\n\n— via Vista · ${attribution}`.trim()
  try {
    const token = await installationToken(repo.installation_id)
    const issue = await createIssue(token, repo.owner, repo.repo, {
      title,
      body: issueBody,
      labels: ['via:vista'],
      milestone: milestoneNumber ?? undefined,
    })
    await admin.from('submissions').update({ github_issue_number: issue.number }).eq('id', submissionId)
    console.log(`create-issue ${repo.owner}/${repo.repo}#${issue.number} from submission ${submissionId}`)
    return jsonResponse({ github_issue_number: issue.number })
  } catch (e) {
    // Roll back only the claim we made: guard on the 'planned' state (and still-uncreated) so a
    // concurrent owner decision (e.g. decline) made during the GitHub call is not clobbered. (#187 / S5)
    await admin
      .from('submissions')
      .update({ status: sub.status, decided_by: null, decided_at: null })
      .eq('id', submissionId)
      .eq('status', 'planned')
      .is('github_issue_number', null)
    return jsonResponse({ error: e instanceof Error ? e.message : 'github create failed' }, 502)
  }
})
