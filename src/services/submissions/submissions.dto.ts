import type { Database } from '@/types/database.types'

export type SubmissionRow = Database['public']['Tables']['submissions']['Row']
export type SubmissionType = SubmissionRow['type']
export type SubmissionStatus = SubmissionRow['status']
export type SubmissionMessageRow = Database['public']['Tables']['submission_messages']['Row']

/** Coarse grouping of the rich lifecycle (#249), for triage queues / tabs that don't need every state. */
export type SubmissionStatusGroup = 'review' | 'accepted' | 'declined'
export const REVIEW_STATUSES: SubmissionStatus[] = ['received', 'under_review', 'needs_info']
export const ACCEPTED_STATUSES: SubmissionStatus[] = ['planned', 'in_progress', 'delivered']
export function submissionGroup(status: SubmissionStatus): SubmissionStatusGroup {
  if (status === 'declined') return 'declined'
  return ACCEPTED_STATUSES.includes(status) ? 'accepted' : 'review'
}

/** Finer lifecycle stages for the grouped inbox sections (#250 revamp). */
export type SubmissionStage = 'review' | 'in_progress' | 'delivered' | 'declined'
export const SUBMISSION_STAGES: SubmissionStage[] = ['review', 'in_progress', 'delivered', 'declined']
export function submissionStage(status: SubmissionStatus): SubmissionStage {
  if (status === 'declined') return 'declined'
  if (status === 'delivered') return 'delivered'
  if (status === 'planned' || status === 'in_progress') return 'in_progress'
  return 'review'
}

/** A submission plus its project's name + color, for the owner's cross-project inbox (#145/#175). */
export type OwnerInboxItem = SubmissionRow & { projectName: string; projectColor: string | null }

/** Identity (submitted_by + submitter name/email) is stamped server-side from the profile (#99). */
export interface CreateSubmissionInput {
  projectId: string
  type: SubmissionType
  title: string
  body?: string
}
