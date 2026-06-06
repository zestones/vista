import { createClient } from '@supabase/supabase-js'
import { env } from '@/config/env'
import type { Database } from '@/types/database.types'

/**
 * Single Supabase client (anon key, subject to RLS).
 * Equivalent of ARIA's lib/api/api.client.ts — but supabase-js handles JWT + refresh,
 * and the security boundary is RLS. See docs: RLS & politiques d'accès.
 */
export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey)
