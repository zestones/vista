import type { Database } from '@/types/database.types'

export type MemberRow = Database['public']['Tables']['project_members']['Row']
export type MemberRole = MemberRow['role']
