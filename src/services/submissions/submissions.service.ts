import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import { auth } from '@/services/auth'
import type { CreateSubmissionInput, SubmissionRow, SubmissionStatus } from './submissions.dto'

/** Approve options (#32): the owner picks the target repo (a sole repo is auto-resolved) + an optional milestone. */
export interface ApproveOptions {
  projectRepoId?: string
  milestoneNumber?: number
}

export interface SubmissionsApi {
  listSubmissions(projectId: string): Promise<SubmissionRow[]>
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRow>
  /** Deny (or other status flips). Owner-gated by RLS. Approval goes through `approveSubmission`. */
  setStatus(submissionId: string, status: SubmissionStatus): Promise<void>
  /** Approve (#32): opens the GitHub issue via the `create-issue` edge, stores the number, sets `approved`. */
  approveSubmission(submissionId: string, opts?: ApproveOptions): Promise<void>
}

let seq = 0

const mock: SubmissionsApi = {
  listSubmissions(projectId) {
    return Promise.resolve(mockDb().submissions.filter((s) => s.project_id === projectId))
  },
  createSubmission(input) {
    const me = auth.currentUser() // identity is server-stamped from the profile (#99); mirror it here
    const row: SubmissionRow = {
      id: `sub-new-${String((seq += 1))}`,
      project_id: input.projectId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      submitted_by: me?.id ?? null,
      submitter_name: me?.name ?? null,
      submitter_email: me?.email ?? null,
      status: 'pending',
      github_issue_number: null,
      created_at: new Date().toISOString(),
      decided_at: null,
      decided_by: null,
    }
    mockDb().submissions.push(row)
    return Promise.resolve(row)
  },
  setStatus(submissionId, status) {
    const sub = mockDb().submissions.find((s) => s.id === submissionId)
    if (sub) sub.status = status
    return Promise.resolve()
  },
  approveSubmission(submissionId) {
    const sub = mockDb().submissions.find((s) => s.id === submissionId)
    if (sub) {
      sub.status = 'approved'
      sub.github_issue_number = 1000 + Math.floor(Math.random() * 9000) // simulate the GitHub write-back
    }
    return Promise.resolve()
  },
}

// Supabase: RLS gates these (insert -> editor+, read -> owner/author, update -> owner).
const supabaseApi: SubmissionsApi = {
  async listSubmissions(projectId) {
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
  },
  async createSubmission(input) {
    const { data, error } = await supabase
      .from('submissions')
      // submitted_by + submitter_name/email are stamped server-side from the profile (#99 trigger).
      .insert({
        project_id: input.projectId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
      })
      .select()
      .single()
    if (error) throw error
    return data
  },
  async setStatus(submissionId, status) {
    const { error } = await supabase.from('submissions').update({ status }).eq('id', submissionId)
    if (error) throw error
  },
  async approveSubmission(submissionId, opts) {
    // The edge re-checks owner, opens the issue, stores the number, and sets `approved` (idempotent).
    const { error } = (await supabase.functions.invoke('create-issue', {
      body: { submission_id: submissionId, project_repo_id: opts?.projectRepoId, milestone_number: opts?.milestoneNumber },
    })) as { data: unknown; error: Error | null }
    if (error) throw error
  },
}

export const submissions: SubmissionsApi = env.backend === 'supabase' ? supabaseApi : mock
