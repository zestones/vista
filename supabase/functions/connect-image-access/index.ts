// connect-image-access (#262): store the owner's CLASSIC OAuth App token so the sync can download
// private-repo attachment images and re-host them. The GitHub App user-to-server token (#184/#262a)
// CANNOT read user-attachments (404) -- only a classic OAuth token with `repo` scope can -- so this is
// a separate, one-time authorization the owner grants. The token is stored ENCRYPTED (#262a machinery)
// on every installation the owner has, and used server-side only.
import { admin, requireUser, UnauthorizedError } from '../_shared/supabaseAdmin.ts'
import { exchangeOAuthAppCode } from '../_shared/github.ts'
import { jsonResponse, preflight } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre
  if (req.method !== 'POST') return jsonResponse({ error: 'method not allowed' }, 405)

  let userId: string
  try {
    userId = (await requireUser(req)).id
  } catch (e) {
    return jsonResponse({ error: e instanceof UnauthorizedError ? e.message : 'unauthorized' }, 401)
  }

  let code: string
  try {
    const body = (await req.json()) as { code?: unknown }
    code = typeof body.code === 'string' ? body.code.trim() : ''
    if (code === '') throw new Error('missing code')
  } catch {
    return jsonResponse({ error: 'code required' }, 400)
  }

  let token: string
  try {
    token = await exchangeOAuthAppCode(code)
  } catch {
    return jsonResponse({ error: 'could not exchange authorization code' }, 400)
  }

  // Store on every installation the caller owns. (A future install needs a re-authorization; rare.)
  const { data: insts } = await admin.from('github_installations').select('installation_id').eq('installed_by', userId)
  if (!insts || insts.length === 0) return jsonResponse({ error: 'connect a GitHub installation first' }, 400)
  for (const i of insts as { installation_id: number }[]) {
    const { error } = await admin.rpc('store_installation_token', { p_installation_id: i.installation_id, p_token: token, p_refresh: null, p_expires: null })
    if (error) console.error('[connect-image-access] token store failed:', error.message)
  }

  return jsonResponse({ ok: true, installations: insts.length })
})
