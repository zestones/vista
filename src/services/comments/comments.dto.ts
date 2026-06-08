import type { Database } from '@/types/database.types'

type Tables = Database['public']['Tables']
export type CommentRow = Tables['comments']['Row']

/** The issue's opening post (#119): body + author, rendered as the first entry in the comment panel. */
export type OpeningPost = Pick<Tables['issues']['Row'], 'body' | 'author_login' | 'author_avatar_url' | 'created_at'>
