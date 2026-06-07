// connect-installation (#19): link a GitHub App installation to the authenticated owner.
//
// The owner's browser POSTs `{ installation_id }` with their Supabase JWT after the
// post-install redirect. We verify the install exists via the App JWT (#21), then write
// the github_installations row (service role -- the projection is deny-all under RLS).
//
// Backfill is intentionally NOT triggered here: sync runs on project_repos, which are
// created at repo-attach (#20). The sync kick lives in #20/#22.
import { admin, requireUser, UnauthorizedError } from '../_shared/supabaseAdmin.ts'
import { getInstallation } from '../_shared/github.ts'
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
  try {
    const body = (await req.json()) as { installation_id?: unknown }
    installationId = Number(body.installation_id)
    if (!Number.isInteger(installationId) || installationId <= 0) throw new Error('bad id')
  } catch {
    return jsonResponse({ error: 'installation_id (positive integer) required' }, 400)
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
