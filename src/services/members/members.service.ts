import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import type { MemberRole, MemberRow } from './members.dto'

// Owner-only member management (#103). All mutations are gated by the `members_manage` RLS
// (owner `for all`) -- no RPC needed. `deny` removes the pending row (member_status has no 'denied').
export interface MembersApi {
  listMembers(projectId: string): Promise<MemberRow[]>
  approveMember(memberId: string): Promise<void>
  denyMember(memberId: string): Promise<void>
  setMemberRole(memberId: string, role: MemberRole): Promise<void>
  removeMember(memberId: string): Promise<void>
}

const mock: MembersApi = {
  listMembers(projectId) {
    return Promise.resolve(mockDb().members.filter((m) => m.project_id === projectId))
  },
  approveMember(memberId) {
    const m = mockDb().members.find((x) => x.id === memberId)
    if (m) {
      m.status = 'active'
      m.decided_at = new Date().toISOString()
    }
    return Promise.resolve()
  },
  denyMember(memberId) {
    const db = mockDb()
    db.members = db.members.filter((m) => m.id !== memberId)
    return Promise.resolve()
  },
  setMemberRole(memberId, role) {
    const m = mockDb().members.find((x) => x.id === memberId)
    if (m) m.role = role
    return Promise.resolve()
  },
  removeMember(memberId) {
    const db = mockDb()
    db.members = db.members.filter((m) => m.id !== memberId)
    return Promise.resolve()
  },
}

const supabaseApi: MembersApi = {
  async listMembers(projectId) {
    const { data, error } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .order('invited_at', { ascending: true })
    if (error) throw error
    return data
  },
  async approveMember(memberId) {
    const { error } = await supabase
      .from('project_members')
      .update({ status: 'active', decided_at: new Date().toISOString() })
      .eq('id', memberId)
    if (error) throw error
  },
  async denyMember(memberId) {
    const { error } = await supabase.from('project_members').delete().eq('id', memberId)
    if (error) throw error
  },
  async setMemberRole(memberId, role) {
    const { error } = await supabase.from('project_members').update({ role }).eq('id', memberId)
    if (error) throw error
  },
  async removeMember(memberId) {
    const { error } = await supabase.from('project_members').delete().eq('id', memberId)
    if (error) throw error
  },
}

export const members: MembersApi = env.backend === 'supabase' ? supabaseApi : mock
