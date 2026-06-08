// Shared backfill/incremental sync core (#22) so it can run from both the sync-repo endpoint
// (cron/internal) and inline when a repo is first attached (connect-repos), giving the owner
// data immediately instead of waiting for the hourly cron.
//
// Backfill (no prior state) fetches everything; incremental uses `since` (issues) + an ETag/304
// (milestones). Upserts are idempotent by (project_repo_id, number) and NEVER write `shared`.
import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { installationToken, listIssueComments, listIssues, listMilestones } from './github.ts'
import { upsertComments, upsertIssues, upsertMilestones } from './projection.ts'

export class RepoNotFoundError extends Error {}

export interface SyncResult {
  milestonesUpserted: number
  issuesUpserted: number
  commentsUpserted: number
  milestonesNotModified: boolean
}

export async function syncRepo(admin: SupabaseClient, projectRepoId: string): Promise<SyncResult> {
  const { data: repo, error: repoErr } = await admin
    .from('project_repos')
    .select('id, owner, repo, installation_id')
    .eq('id', projectRepoId)
    .maybeSingle()
  if (repoErr) throw new Error('project_repo lookup failed')
  if (!repo) throw new RepoNotFoundError('project_repo not found')

  const { data: state } = await admin
    .from('sync_state')
    .select('last_synced_at, last_etag')
    .eq('project_repo_id', projectRepoId)
    .maybeSingle()

  const token = await installationToken(repo.installation_id)
  // Use the START time as the next `since` so a change during this run is caught next time (safe overlap).
  const startedAt = new Date().toISOString()

  const ms = await listMilestones(token, repo.owner, repo.repo, state?.last_etag ?? null)
  const issues = await listIssues(token, repo.owner, repo.repo, state?.last_synced_at ?? null)
  const comments = await listIssueComments(token, repo.owner, repo.repo, state?.last_synced_at ?? null)
  let milestonesUpserted = 0
  let issuesUpserted = 0
  // Upsert milestones first so upsertIssues can resolve milestone linkage; then issues so upsertComments
  // can resolve issue linkage. All omit `shared`; comments have no `shared` column.
  if (!ms.notModified) milestonesUpserted = await upsertMilestones(admin, projectRepoId, ms.milestones, startedAt)
  issuesUpserted = await upsertIssues(admin, projectRepoId, issues, startedAt)
  const commentsUpserted = await upsertComments(admin, projectRepoId, comments, startedAt)

  const { error: stateErr } = await admin
    .from('sync_state')
    .upsert({ project_repo_id: projectRepoId, last_synced_at: startedAt, last_etag: ms.etag }, { onConflict: 'project_repo_id' })
  if (stateErr) throw new Error(`sync_state upsert failed: ${stateErr.message}`)

  console.log(
    `sync-repo ${repo.owner}/${repo.repo}: milestones=${milestonesUpserted} issues=${issuesUpserted} comments=${commentsUpserted} (304=${ms.notModified})`,
  )
  return { milestonesUpserted, issuesUpserted, commentsUpserted, milestonesNotModified: ms.notModified }
}
