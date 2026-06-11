import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import { auth } from '@/services/auth'
import {
  REVIEW_STATUSES,
  type CreateSubmissionInput,
  type OwnerInboxItem,
  type SubmissionMessageRow,
  type SubmissionRow,
  type SubmissionStatus,
} from './submissions.dto'

/** Approve options (#32): the owner picks the target repo (a sole repo is auto-resolved) + an optional milestone. */
export interface ApproveOptions {
  projectRepoId?: string
  milestoneNumber?: number
}

export interface SubmissionsApi {
  listSubmissions(projectId: string): Promise<SubmissionRow[]>
  /** Undecided submissions across the owner's projects (#145), each with its project name, for the inbox. */
  listOwnerInbox(userId: string): Promise<OwnerInboxItem[]>
  createSubmission(input: CreateSubmissionInput): Promise<SubmissionRow>
  /** Set the lifecycle status (#249). Owner-gated by RLS. Approval goes through `approveSubmission`. */
  setStatus(submissionId: string, status: SubmissionStatus): Promise<void>
  /** Approve (#32): opens the GitHub issue via the `create-issue` edge, stores the number, sets `planned`. */
  approveSubmission(submissionId: string, opts?: ApproveOptions): Promise<void>
  /** The discussion thread on a submission (#249), oldest first. */
  listMessages(submissionId: string): Promise<SubmissionMessageRow[]>
  /** Post a message; author identity is server-stamped from the profile (#99 pattern). */
  postMessage(submissionId: string, body: string): Promise<SubmissionMessageRow>
}

let seq = 0
let msgSeq = 0

const mock: SubmissionsApi = {
  listSubmissions(projectId) {
    return Promise.resolve(mockDb().submissions.filter((s) => s.project_id === projectId))
  },
  listOwnerInbox(userId) {
    const db = mockDb()
    const owned = new Map(db.projects.filter((p) => p.owner_id === userId).map((p) => [p.id, p] as const))
    return Promise.resolve(
      db.submissions
        .filter((s) => REVIEW_STATUSES.includes(s.status) && owned.has(s.project_id))
        .map((s) => ({ ...s, projectName: owned.get(s.project_id)?.name ?? '', projectColor: owned.get(s.project_id)?.color ?? null })),
    )
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
      status: 'received',
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
      sub.status = 'planned'
      sub.github_issue_number = 1000 + Math.floor(Math.random() * 9000) // simulate the GitHub write-back
    }
    return Promise.resolve()
  },
  listMessages(submissionId) {
    return Promise.resolve(
      mockDb()
        .submissionMessages.filter((m) => m.submission_id === submissionId)
        .sort((a, b) => a.created_at.localeCompare(b.created_at)),
    )
  },
  postMessage(submissionId, body) {
    const me = auth.currentUser()
    const row: SubmissionMessageRow = {
      id: `msg-${String((msgSeq += 1))}`,
      submission_id: submissionId,
      author_id: me?.id ?? null,
      author_name: me?.name ?? null,
      author_email: me?.email ?? null,
      body,
      created_at: new Date().toISOString(),
    }
    mockDb().submissionMessages.push(row)
    return Promise.resolve(row)
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
  async listOwnerInbox(userId) {
    // RLS returns the owner's projects' submissions + the user's own authored ones; the inner join +
    // owner_id filter keeps only projects this user owns. Review group only -- the inbox is a triage queue.
    const { data, error } = await supabase
      .from('submissions')
      .select('*, projects!inner(name, owner_id, color)')
      .in('status', REVIEW_STATUSES)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data
      .filter((r) => r.projects.owner_id === userId)
      .map(({ projects, ...s }) => ({ ...s, projectName: projects.name, projectColor: projects.color }))
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
    // The edge re-checks owner, opens the issue, stores the number, and sets `planned` (idempotent).
    const { error } = (await supabase.functions.invoke('create-issue', {
      body: { submission_id: submissionId, project_repo_id: opts?.projectRepoId, milestone_number: opts?.milestoneNumber },
    })) as { data: unknown; error: Error | null }
    if (error) throw error
  },
  async listMessages(submissionId) {
    const { data, error } = await supabase
      .from('submission_messages')
      .select('*')
      .eq('submission_id', submissionId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return data
  },
  async postMessage(submissionId, body) {
    // author_id + name/email are stamped server-side from the profile (#99 trigger).
    const { data, error } = await supabase.from('submission_messages').insert({ submission_id: submissionId, body }).select().single()
    if (error) throw error
    return data
  },
}

export const submissions: SubmissionsApi = env.backend === 'supabase' ? supabaseApi : mock
