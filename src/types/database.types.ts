// ⚠ PLACEHOLDER — replace with the generated file once Supabase is wired:
//   supabase gen types typescript --linked > src/types/database.types.ts
// Kept minimal but valid so services/DTOs typecheck during Phase 1 (mock).

export type MemberRole = 'owner' | 'editor' | 'viewer'
export type MemberStatus = 'pending' | 'active'
export type ProjectVisibility = 'private' | 'shared'
export type SubmissionType = 'feature' | 'bug' | 'question' | 'other'
export type SubmissionStatus = 'pending' | 'approved' | 'denied'

interface Table<Row> {
  Row: Row
  Insert: Partial<Row>
  Update: Partial<Row>
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      projects: Table<{
        id: string
        owner_id: string
        name: string
        description: string | null
        color: string | null
        visibility: ProjectVisibility
        available_on_vista: boolean
        created_at: string
      }>
      project_members: Table<{
        id: string
        project_id: string
        user_id: string | null
        email: string
        name: string | null
        role: MemberRole
        status: MemberStatus
        invited_at: string
      }>
      milestones: Table<{
        id: string
        project_repo_id: string
        number: number
        title: string
        description: string | null
        due_on: string | null
        state: string | null
        open_issues: number
        closed_issues: number
        shared: boolean
        updated_at: string
      }>
      issues: Table<{
        id: string
        project_repo_id: string
        milestone_id: string | null
        number: number
        title: string
        state: string | null
        labels: unknown
        author_login: string | null
        author_avatar_url: string | null
        html_url: string | null
        created_at: string | null
        closed_at: string | null
        shared: boolean
        updated_at: string
      }>
      submissions: Table<{
        id: string
        project_id: string
        type: SubmissionType
        title: string
        body: string | null
        submitted_by: string | null
        submitter_name: string | null
        submitter_email: string | null
        status: SubmissionStatus
        github_issue_number: number | null
        created_at: string
      }>
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
  }
}
