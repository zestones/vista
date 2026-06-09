import type { Database } from '@/types/database.types'

export type SubmissionRow = Database['public']['Tables']['submissions']['Row']
export type SubmissionType = SubmissionRow['type']
export type SubmissionStatus = SubmissionRow['status']

/** A submission plus its project's name + color, for the owner's cross-project inbox (#145/#175). */
export type OwnerInboxItem = SubmissionRow & { projectName: string; projectColor: string | null }

/** Identity (submitted_by + submitter name/email) is stamped server-side from the profile (#99). */
export interface CreateSubmissionInput {
  projectId: string
  type: SubmissionType
  title: string
  body?: string
}
