import { env } from '@/config/env'
import { mockDb } from '@/lib/mock'
import { supabase } from '@/lib/supabase/client'
import { auth } from '@/services/auth'
import type { NotificationRow } from './notifications.dto'

// In-app notifications (#108). Rows are written server-side by triggers; here we just read the
// current user's (RLS scopes a non-owner to their own) and mark them read.
export interface NotificationsApi {
  list(): Promise<NotificationRow[]>
  markRead(id: string): Promise<void>
  markAllRead(): Promise<void>
}

const mock: NotificationsApi = {
  list() {
    const me = auth.currentUser()?.id
    return Promise.resolve(
      mockDb()
        .notifications.filter((n) => n.user_id === me)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    )
  },
  markRead(id) {
    const n = mockDb().notifications.find((x) => x.id === id)
    if (n && !n.read_at) n.read_at = new Date().toISOString()
    return Promise.resolve()
  },
  markAllRead() {
    const me = auth.currentUser()?.id
    mockDb().notifications.forEach((n) => {
      if (n.user_id === me && !n.read_at) n.read_at = new Date().toISOString()
    })
    return Promise.resolve()
  },
}

const supabaseApi: NotificationsApi = {
  async list() {
    const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(30)
    if (error) throw error
    return data
  },
  async markRead(id) {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
  },
  async markAllRead() {
    const { error } = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).is('read_at', null)
    if (error) throw error
  },
}

export const notifications: NotificationsApi = env.backend === 'supabase' ? supabaseApi : mock
