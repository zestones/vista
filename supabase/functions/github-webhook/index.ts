// github-webhook (#23): real-time projection updates from GitHub.
//
// 1. Verify X-Hub-Signature-256 (HMAC-SHA256 over the RAW body) before anything else -> 401.
// 2. Route by X-GitHub-Event + action.
// 3. Idempotent upserts that NEVER touch `shared` (reuse _shared/projection).
//
// A repo can be attached to several projects, so we fan out to every matching project_repo.
import { admin } from '../_shared/supabaseAdmin.ts'
import { upsertIssues, upsertMilestones } from '../_shared/projection.ts'
import { type GhIssue, type GhMilestone } from '../_shared/github.ts'

const encoder = new TextEncoder()

function mustEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

/** Constant-time string compare (avoid signature timing leaks). */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function verifySignature(secret: string, body: string, header: string | null): Promise<boolean> {
  if (!header) return false
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')
  return timingSafeEqual(`sha256=${hex}`, header)
}

interface WebhookPayload {
  action?: string
  repository?: { owner: { login: string }; name: string }
  installation?: { id: number }
  issue?: GhIssue
  milestone?: GhMilestone
  repositories_removed?: { full_name: string }[]
}

/** project_repo ids attached to (owner, repo) under this installation. */
async function projectReposFor(p: WebhookPayload): Promise<string[]> {
  if (!p.repository || !p.installation) return []
  const { data } = await admin
    .from('project_repos')
    .select('id')
    .eq('owner', p.repository.owner.login)
    .eq('repo', p.repository.name)
    .eq('installation_id', p.installation.id)
  return ((data ?? []) as { id: string }[]).map((r) => r.id)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405 })

  // RAW body first -- the HMAC is over the exact bytes, so verify before parsing.
  const body = await req.text()
  if (!(await verifySignature(mustEnv('GITHUB_WEBHOOK_SECRET'), body, req.headers.get('x-hub-signature-256')))) {
    return new Response('bad signature', { status: 401 })
  }

  const event = req.headers.get('x-github-event') ?? ''
  const payload = JSON.parse(body) as WebhookPayload
  const now = new Date().toISOString()

  try {
    if (event === 'issues' && payload.issue) {
      const issue = payload.issue
      for (const prId of await projectReposFor(payload)) {
        if (payload.action === 'deleted') {
          await admin.from('issues').delete().eq('project_repo_id', prId).eq('number', issue.number)
        } else if (!issue.pull_request) {
          await upsertIssues(admin, prId, [issue], now)
        }
      }
    } else if (event === 'milestone' && payload.milestone) {
      const milestone = payload.milestone
      for (const prId of await projectReposFor(payload)) {
        if (payload.action === 'deleted') {
          await admin.from('milestones').delete().eq('project_repo_id', prId).eq('number', milestone.number)
        } else {
          await upsertMilestones(admin, prId, [milestone], now)
        }
      }
    } else if (event === 'installation' && payload.action === 'deleted' && payload.installation) {
      // Uninstall: drop the link (cascades to project_repos / milestones / issues).
      await admin.from('github_installations').delete().eq('installation_id', payload.installation.id)
    } else if (event === 'installation_repositories' && payload.action === 'removed' && payload.installation) {
      for (const r of payload.repositories_removed ?? []) {
        const [owner, name] = r.full_name.split('/')
        await admin.from('project_repos').delete().eq('owner', owner).eq('repo', name).eq('installation_id', payload.installation.id)
      }
    }
    // else: acknowledged, no-op (ping, installation.created, *.added, other actions).
  } catch (e) {
    console.log(`github-webhook ${event}/${payload.action ?? ''} failed: ${e instanceof Error ? e.message : 'error'}`)
    return new Response('processing error', { status: 500 })
  }

  return Response.json({ ok: true, event, action: payload.action ?? null })
})
