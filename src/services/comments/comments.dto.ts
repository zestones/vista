import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
export type CommentRow = Tables['comments']['Row']
