import type { Database } from '@/types/database.types'

export type NotificationRow = Database['public']['Tables']['notifications']['Row']
export type NotificationKind = NotificationRow['kind']
