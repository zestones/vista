// connect-repos (#20): the owner lists their installation's repos and attaches/detaches
// them to a project. All writes are server-side (service role) -- the projection is
// client-read-only (owner-read RLS). Repos are validated against the installation before
// attach. Installation tokens never reach the browser.
import { admin, requireUser, UnauthorizedError } from '../_shared/supabaseAdmin.ts'
import { installationToken, listInstallationRepos } from '../_shared/github.ts'
import { syncRepo } from '../_shared/sync.ts'
import { jsonResponse, preflight } from '../_shared/cors.ts'

interface AvailableRepo {
  installation_id: number
  owner: string
  repo: string
  github_repo_id: number
  private: boolean
}

async function ownsProject(userId: string, projectId: string): Promise<boolean> {
  const { data } = await admin.from('projects').select('id').eq('id', projectId).eq('owner_id', userId).maybeSingle()
  return data != null
}

/** Repos across all of the caller's installations (each token minted server-side). */
async function availableRepos(userId: string): Promise<AvailableRepo[]> {
  const { data: installs } = await admin
    .from('github_installations')
    .select('installation_id')
    .eq('installed_by', userId)
  const out: AvailableRepo[] = []
  for (const inst of installs ?? []) {
    const token = await installationToken(inst.installation_id)
    for (const r of await listInstallationRepos(token)) {
      out.push({ installation_id: inst.installation_id, owner: r.owner.login, repo: r.name, github_repo_id: r.id, private: r.private })
    }
  }
  return out
}

async function handleAttach(userId: string, body: Record<string, unknown>): Promise<Response> {
  const projectId = String(body.project_id ?? '')
  const installationId = Number(body.installation_id)
  const owner = String(body.owner ?? '')
  const repo = String(body.repo ?? '')
  if (!projectId || !owner || !repo || !Number.isInteger(installationId)) {
    return jsonResponse({ error: 'project_id, installation_id, owner, repo required' }, 400)
  }
  if (!(await ownsProject(userId, projectId))) return jsonResponse({ error: 'not your project' }, 403)

  // The installation must be the caller's, and the repo must actually be in it.
  const match = (await availableRepos(userId)).find(
    (r) => r.installation_id === installationId && r.owner === owner && r.repo === repo,
  )
  if (!match) return jsonResponse({ error: 'repo not available in your installation' }, 422)

  const { data, error } = await admin
    .from('project_repos')
    .insert({ project_id: projectId, installation_id: installationId, owner, repo, github_repo_id: match.github_repo_id })
    .select('id, project_id, installation_id, owner, repo, github_repo_id')
    .single()
  if (error) {
    if (error.code === '23505') return jsonResponse({ error: 'repo already attached' }, 409)
    return jsonResponse({ error: 'failed to attach repo' }, 500)
  }

  // Backfill immediately so the roadmap isn't empty until the hourly cron runs. A backfill
  // hiccup must not fail the attach (the row is in; the cron will catch it) -- log and move on.
  try {
    await syncRepo(admin, data.id)
  } catch (e) {
    console.error('attach backfill failed', e instanceof Error ? e.message : e)
  }
  return jsonResponse({ projectRepo: data }, 201)
}

async function handleDetach(userId: string, body: Record<string, unknown>): Promise<Response> {
  const projectRepoId = String(body.project_repo_id ?? '')
  if (!projectRepoId) return jsonResponse({ error: 'project_repo_id required' }, 400)
  const { data: row } = await admin.from('project_repos').select('id, project_id').eq('id', projectRepoId).maybeSingle()
  if (!row) return jsonResponse({ error: 'not found' }, 404)
  if (!(await ownsProject(userId, row.project_id))) return jsonResponse({ error: 'not your project' }, 403)
  const { error } = await admin.from('project_repos').delete().eq('id', projectRepoId)
  if (error) return jsonResponse({ error: 'failed to detach repo' }, 500)
  return jsonResponse({ ok: true })
}

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

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return jsonResponse({ error: 'invalid body' }, 400)
  }

  switch (body.action) {
    case 'list':
      return jsonResponse({ repos: await availableRepos(userId) })
    case 'attach':
      return await handleAttach(userId, body)
    case 'detach':
      return await handleDetach(userId, body)
    default:
      return jsonResponse({ error: 'unknown action' }, 400)
  }
})
