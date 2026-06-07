import type { Database } from '@/types/database.types'

export type SubmissionRow = Database['public']['Tables']['submissions']['Row']
export type SubmissionType = SubmissionRow['type']
export type SubmissionStatus = SubmissionRow['status']

export interface CreateSubmissionInput {
  projectId: string
  type: SubmissionType
  title: string
  body?: string
  submitterName?: string
  submitterEmail?: string
}
