import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { notImplemented } from '../_shared/not-implemented'
import type { CreateSubmissionInput, SubmissionRow } from './submissions.dto'

export interface SubmissionsApi {
  listSubmissions(projectId: string): Promise<SubmissionRow[]>
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRow>
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
}

const supabase: SubmissionsApi = {
  listSubmissions: () => notImplemented('submissions.listSubmissions'),
  createSubmission: () => notImplemented('submissions.createSubmission'),
}

export const submissions: SubmissionsApi = env.backend === 'supabase' ? supabase : mock
