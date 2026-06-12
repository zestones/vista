// connect-installation (#19, #184): link a GitHub App installation to the authenticated owner.
//
// The owner's browser POSTs `{ installation_id, code }` with their Supabase JWT after the post-install
// redirect. `code` is the GitHub App OAuth code from that redirect; we exchange it for the caller's
// GitHub user token and verify they can administer this installation (#184) -- otherwise any logged-in
// Vista user could link (and then read the private repos of) an installation they don't own. We also
// confirm the install exists via the App JWT (#21), then write the github_installations row (service
// role -- the projection is deny-all under RLS). The user token is used once for the check and discarded.
//
// Backfill is intentionally NOT triggered here: sync runs on project_repos, which are
// created at repo-attach (#20). The sync kick lives in #20/#22.
import { admin, requireUser, UnauthorizedError } from '../_shared/supabaseAdmin.ts'
import { exchangeOAuthCode, getInstallation, userCanManageInstallation } from '../_shared/github.ts'
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

  let installationId: number
  let code: string
  try {
    const body = (await req.json()) as { installation_id?: unknown; code?: unknown }
    installationId = Number(body.installation_id)
    if (!Number.isInteger(installationId) || installationId <= 0) throw new Error('bad id')
    code = typeof body.code === 'string' ? body.code.trim() : ''
    if (code === '') throw new Error('missing code')
  } catch {
    return jsonResponse({ error: 'installation_id (positive integer) and code required' }, 400)
  }

  // Prove the caller owns/administers this installation (#184): exchange the post-install OAuth code for
  // their GitHub user token, then confirm the installation is one they can manage. Used once, not stored.
  try {
    const userToken = await exchangeOAuthCode(code)
    const allowed = await userCanManageInstallation(userToken, installationId)
    if (!allowed) return jsonResponse({ error: 'you do not have permission to link this installation' }, 403)
  } catch {
    return jsonResponse({ error: 'could not verify installation ownership' }, 403)
  }

  // Verify the installation exists and read the account it targets (App JWT auth).
  let accountLogin: string
  try {
    const inst = await getInstallation(installationId)
    accountLogin = inst.account?.login ?? ''
    if (!accountLogin) return jsonResponse({ error: 'installation has no account' }, 422)
  } catch {
    return jsonResponse({ error: 'installation not found or unverifiable' }, 404)
  }

  const { data, error } = await admin
    .from('github_installations')
    .insert({ installation_id: installationId, account_login: accountLogin, installed_by: userId })
    .select('id, installation_id, account_login')
    .single()

  if (error) {
    // 23505 = unique_violation: this installation is already linked.
    if (error.code === '23505') {
      const { data: existing } = await admin
        .from('github_installations')
        .select('id, installation_id, account_login, installed_by')
        .eq('installation_id', installationId)
        .single()
      if (existing && existing.installed_by === userId) {
        const { installed_by: _omit, ...installation } = existing
        return jsonResponse({ installation, alreadyConnected: true })
      }
      return jsonResponse({ error: 'installation already linked to another account' }, 409)
    }
    return jsonResponse({ error: 'failed to link installation' }, 500)
  }

  return jsonResponse({ installation: data }, 201)
})
