import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import type { CommentRow, OpeningPost } from './comments.dto'

// Read-only comment access (#92). Comments are projected server-side (#90) and gated by RLS (#91):
// listByIssue returns nothing for a member without the grant. Writes happen only via sync/webhook.
export interface CommentsApi {
  listByIssue(issueId: string): Promise<CommentRow[]>
  // The issue's opening post (#119) — gated by issue visibility (issues RLS), not the comment grant.
  getOpeningPost(issueId: string): Promise<OpeningPost | null>
  // Owner-only hint: how many active, non-owner members can currently view comments on the project.
  viewerCount(projectId: string): Promise<number>
}

const byCreatedAt = (a: CommentRow, b: CommentRow) => (a.created_at ?? '').localeCompare(b.created_at ?? '')

const mock: CommentsApi = {
  listByIssue(issueId) {
    return Promise.resolve(
      mockDb()
        .comments.filter((c) => c.issue_id === issueId)
        .sort(byCreatedAt),
    )
  },
  getOpeningPost(issueId) {
    const i = mockDb().issues.find((x) => x.id === issueId)
    return Promise.resolve(
      i ? { body: i.body, author_login: i.author_login, author_avatar_url: i.author_avatar_url, created_at: i.created_at } : null,
    )
  },
  viewerCount(projectId) {
    const n = mockDb().members.filter(
      (m) => m.project_id === projectId && m.status === 'active' && m.role !== 'owner' && m.can_view_comments,
    ).length
    return Promise.resolve(n)
  },
}

const supabaseApi: CommentsApi = {
  async listByIssue(issueId) {
    const { data, error } = await supabase.from('comments').select('*').eq('issue_id', issueId).order('created_at', { ascending: true })
    if (error) throw error
    return data
  },
  async getOpeningPost(issueId) {
    const { data, error } = await supabase
      .from('issues')
      .select('body, author_login, author_avatar_url, created_at')
      .eq('id', issueId)
      .maybeSingle()
    if (error) throw error
    return data
  },
  async viewerCount(projectId) {
    const { count, error } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('status', 'active')
      .eq('can_view_comments', true)
      .neq('role', 'owner')
    if (error) throw error
    return count ?? 0
  },
}

export const comments: CommentsApi = env.backend === 'supabase' ? supabaseApi : mock
