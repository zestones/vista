// Service-role Supabase client + caller-identity helper -- SERVER-ONLY.
// The service role key bypasses RLS and must never reach the browser.
import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2'

function mustEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are auto-injected by `supabase functions serve`.
export const admin: SupabaseClient = createClient(mustEnv('SUPABASE_URL'), mustEnv('SUPABASE_SERVICE_ROLE_KEY'), {
  auth: { persistSession: false, autoRefreshToken: false },
})

/** Thrown when the caller's JWT is missing or invalid -- map to HTTP 401. */
export class UnauthorizedError extends Error {}

/** Validate the caller's `Authorization: Bearer <jwt>` and return the auth user (uid == profiles.id). */
export async function requireUser(req: Request): Promise<User> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) throw new UnauthorizedError('missing bearer token')
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data.user) throw new UnauthorizedError('invalid token')
  return data.user
}
