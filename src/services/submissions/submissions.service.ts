import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { CreateSubmissionInput, SubmissionRow, SubmissionStatus } from './submissions.dto'

export interface SubmissionsApi {
  listSubmissions(projectId: string): Promise<SubmissionRow[]>
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRow>
  /** Owner moderation (#6). Mock flips the row status; the real backend opens the GitHub issue in a later phase. */
  setStatus(submissionId: string, status: SubmissionStatus): Promise<void>
}

let seq = 0

const mock: SubmissionsApi = {
  listSubmissions(projectId) {
    return Promise.resolve(mockDb().submissions.filter((s) => s.project_id === projectId))
  },
  createSubmission(input) {
    const row: SubmissionRow = {
      id: `sub-new-${String((seq += 1))}`,
      project_id: input.projectId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      submitted_by: null,
      submitter_name: input.submitterName ?? null,
      submitter_email: input.submitterEmail ?? null,
      status: 'pending',
      github_issue_number: null,
      created_at: new Date().toISOString(),
    }
    mockDb().submissions.push(row)
    return Promise.resolve(row)
  },
  setStatus(submissionId, status) {
    const sub = mockDb().submissions.find((s) => s.id === submissionId)
    if (sub) sub.status = status
    return Promise.resolve()
  },
}

const supabase: SubmissionsApi = {
  listSubmissions: () => notImplemented('submissions.listSubmissions'),
  createSubmission: () => notImplemented('submissions.createSubmission'),
  setStatus: () => notImplemented('submissions.setStatus'),
}

export const submissions: SubmissionsApi = env.backend === 'supabase' ? supabase : mock
