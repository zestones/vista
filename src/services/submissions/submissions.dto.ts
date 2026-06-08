import type { Database } from '@/types/database.types'

export type SubmissionRow = Database['public']['Tables']['submissions']['Row']
export type SubmissionType = SubmissionRow['type']
export type SubmissionStatus = SubmissionRow['status']

/** Identity (submitted_by + submitter name/email) is stamped server-side from the profile (#99). */
export interface CreateSubmissionInput {
  projectId: string
  type: SubmissionType
  title: string
  body?: string
}
