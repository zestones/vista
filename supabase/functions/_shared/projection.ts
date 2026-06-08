// Projection mapping + upserts (#22 sync-repo, #23 github-webhook) -- one place.
//
// INVARIANT: these upserts NEVER write `shared`. The owner allowlist must survive every
// sync and webhook (omitting `shared` from the payload preserves it on conflict, and new
// rows default to false = private). See "Cache de projection & synchronisation".
import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { type GhComment, type GhIssue, type GhMilestone, issueNumberFromUrl } from './github.ts'

export function toMilestoneRow(projectRepoId: string, m: GhMilestone, now: string) {
  return {
    project_repo_id: projectRepoId,
    number: m.number,
    title: m.title,
    description: m.description,
    due_on: m.due_on,
    state: m.state,
    open_issues: m.open_issues,
    closed_issues: m.closed_issues,
    updated_at: now,
  }
}

export function toIssueRow(projectRepoId: string, i: GhIssue, milestoneId: string | null, now: string) {
  return {
    project_repo_id: projectRepoId,
    number: i.number,
    title: i.title,
    body: i.body ?? null,
    state: i.state,
    labels: i.labels.map((l) => (typeof l === 'string' ? l : l.name)),
    author_login: i.user?.login ?? null,
    author_avatar_url: i.user?.avatar_url ?? null,
    html_url: i.html_url,
    created_at: i.created_at,
    closed_at: i.closed_at,
    milestone_id: milestoneId,
    updated_at: now,
  }
}

/** Milestone number -> projection id for the repo, used to link issues. */
export async function milestoneIdByNumber(admin: SupabaseClient, projectRepoId: string): Promise<Map<number, string>> {
  const { data } = await admin.from('milestones').select('id, number').eq('project_repo_id', projectRepoId)
  const rows = (data ?? []) as { id: string; number: number }[]
  return new Map(rows.map((m) => [m.number, m.id]))
}

/** Upsert milestones by (project_repo_id, number); omits `shared`. Returns the count. */
export async function upsertMilestones(admin: SupabaseClient, projectRepoId: string, milestones: GhMilestone[], now: string): Promise<number> {
  if (milestones.length === 0) return 0
  const rows = milestones.map((m) => toMilestoneRow(projectRepoId, m, now))
  const { error } = await admin.from('milestones').upsert(rows, { onConflict: 'project_repo_id,number' })
  if (error) throw new Error(`milestone upsert: ${error.message}`)
  return rows.length
}

/** Upsert issues by (project_repo_id, number); resolves milestone linkage; omits `shared`. */
export async function upsertIssues(admin: SupabaseClient, projectRepoId: string, issues: GhIssue[], now: string): Promise<number> {
  if (issues.length === 0) return 0
  const byNumber = await milestoneIdByNumber(admin, projectRepoId)
  const rows = issues.map((i) => toIssueRow(projectRepoId, i, i.milestone ? (byNumber.get(i.milestone.number) ?? null) : null, now))
  const { error } = await admin.from('issues').upsert(rows, { onConflict: 'project_repo_id,number' })
  if (error) throw new Error(`issue upsert: ${error.message}`)
  return rows.length
}

/** Issue number -> projection id for the repo, used to link comments to their parent issue. */
export async function issueIdByNumber(admin: SupabaseClient, projectRepoId: string): Promise<Map<number, string>> {
  const { data } = await admin.from('issues').select('id, number').eq('project_repo_id', projectRepoId)
  const rows = (data ?? []) as { id: string; number: number }[]
  return new Map(rows.map((i) => [i.number, i.id]))
}

export function toCommentRow(projectRepoId: string, issueId: string, c: GhComment) {
  return {
    project_repo_id: projectRepoId,
    issue_id: issueId,
    github_comment_id: c.id,
    author_login: c.user?.login ?? null,
    author_avatar_url: c.user?.avatar_url ?? null,
    body: c.body,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }
}

/**
 * Upsert issue comments by (project_repo_id, github_comment_id). Each comment is linked to its parent
 * issue via `issue_url`; a comment whose parent is NOT in our `issues` projection is dropped -- this is
 * what excludes PR comments (we never project PRs) and orphan comments. Returns the count upserted.
 */
export async function upsertComments(admin: SupabaseClient, projectRepoId: string, comments: GhComment[], _now: string): Promise<number> {
  if (comments.length === 0) return 0
  const byNumber = await issueIdByNumber(admin, projectRepoId)
  const rows = comments
    .map((c) => {
      const n = issueNumberFromUrl(c.issue_url)
      const issueId = n != null ? byNumber.get(n) : undefined
      return issueId ? toCommentRow(projectRepoId, issueId, c) : null
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
  if (rows.length === 0) return 0
  const { error } = await admin.from('comments').upsert(rows, { onConflict: 'project_repo_id,github_comment_id' })
  if (error) throw new Error(`comment upsert: ${error.message}`)
  return rows.length
}
