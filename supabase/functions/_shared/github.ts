// GitHub App authentication -- SERVER-ONLY (#21).
//
// Two levels of auth (see Architecture/GitHub App/Tokens & accès API):
//   1. App JWT (RS256, signed with the App private key) -- to act "as the App"
//      (list installations, mint installation tokens). exp <= 10 min.
//   2. Installation token (~1h) -- to act on an installation's repos.
//
// Tokens are NEVER logged and NEVER returned to the browser: this module is
// imported by Edge Functions only; nothing here is an HTTP endpoint.
import { importPKCS8, SignJWT } from 'npm:jose@5'

const GITHUB_API = 'https://api.github.com'

function mustEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required env: ${name}`)
  return value
}

// Imported lazily and once: the private key is base64'd PKCS#8 PEM (single-line in the env).
// GitHub issues a PKCS#1 key ("BEGIN RSA PRIVATE KEY"); convert with
//   openssl pkcs8 -topk8 -nocrypt -in app.pem | base64 -w0
// because Web Crypto / jose import PKCS#8, not PKCS#1.
let keyPromise: Promise<CryptoKey> | undefined
function privateKey(): Promise<CryptoKey> {
  keyPromise ??= importPKCS8(atob(mustEnv('GITHUB_APP_PRIVATE_KEY_BASE64')), 'RS256')
  return keyPromise
}

/** App JWT (RS256). Acts "as the App"; exp clamped to 9 min (GitHub's max is 10). */
export async function appJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return await new SignJWT({})
    .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
    .setIssuer(mustEnv('GITHUB_APP_ID'))
    .setIssuedAt(now - 60) // 60s back to tolerate clock skew vs GitHub
    .setExpirationTime(now + 540) // 9 min
    .sign(await privateKey())
}

interface CachedToken {
  token: string
  expiresAt: number // epoch ms
}

// Keep tokens in function memory (not in the DB) and re-mint shortly before expiry.
const tokenCache = new Map<number, CachedToken>()
const EXPIRY_SKEW_MS = 60_000

/**
 * Short-lived installation token (~1h) for `installationId`.
 * Cached in memory and re-minted before expiry. Never log or return this to a client.
 */
export async function installationToken(installationId: number): Promise<string> {
  const cached = tokenCache.get(installationId)
  if (cached && cached.expiresAt - EXPIRY_SKEW_MS > Date.now()) return cached.token

  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}/access_tokens`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await appJwt()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) {
    // Body may carry "message"/"documentation_url" but never a token -- safe to surface.
    throw new Error(`installation token mint failed: ${res.status} ${await res.text()}`)
  }
  const body = (await res.json()) as { token: string; expires_at: string }
  tokenCache.set(installationId, { token: body.token, expiresAt: Date.parse(body.expires_at) })
  return body.token
}

export interface Installation {
  id: number
  account: { login: string } | null
}

/**
 * Fetch an installation by id (App JWT auth). Used by connect-installation (#19) to
 * verify the install exists and read the account it targets. Throws on non-2xx.
 */
export async function getInstallation(installationId: number): Promise<Installation> {
  const res = await fetch(`${GITHUB_API}/app/installations/${installationId}`, {
    headers: {
      Authorization: `Bearer ${await appJwt()}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`get installation ${installationId} failed: ${res.status} ${await res.text()}`)
  return (await res.json()) as Installation
}

export interface InstallationRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string }
  private: boolean
}

/**
 * Repositories an installation can access (installation-token auth, not the App JWT).
 * One page (<=100) -- enough for the MVP; paginate here if an install exceeds that.
 */
export async function listInstallationRepos(token: string): Promise<InstallationRepo[]> {
  const res = await fetch(`${GITHUB_API}/installation/repositories?per_page=100`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })
  if (!res.ok) throw new Error(`list installation repositories failed: ${res.status} ${await res.text()}`)
  return ((await res.json()) as { repositories: InstallationRepo[] }).repositories
}

// --- Repo sync (#22) ---------------------------------------------------------

function ghHeaders(token: string, extra?: Record<string, string>): Record<string, string> {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...extra }
}

/** Parse the `rel="next"` URL from a GitHub Link header, if any. */
function nextLink(link: string | null): string | null {
  for (const part of (link ?? '').split(',')) {
    const m = /<([^>]+)>;\s*rel="next"/.exec(part)
    if (m) return m[1]
  }
  return null
}

export interface GhMilestone {
  number: number
  title: string
  description: string | null
  due_on: string | null
  state: string
  open_issues: number
  closed_issues: number
}

export interface GhIssue {
  number: number
  title: string
  state: string
  labels: Array<{ name: string } | string>
  user: { login: string; avatar_url: string } | null
  html_url: string
  created_at: string
  closed_at: string | null
  milestone: { number: number } | null
  pull_request?: unknown // present => entry is a PR, not an issue
}

export interface MilestonesResult {
  notModified: boolean
  etag: string | null
  milestones: GhMilestone[]
}

/** All milestones (state=all), conditional on `etag` (304 => notModified). Follows pagination. */
export async function listMilestones(token: string, owner: string, repo: string, etag?: string | null): Promise<MilestonesResult> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/milestones?state=all&per_page=100`, {
    headers: ghHeaders(token, etag ? { 'If-None-Match': etag } : undefined),
  })
  if (res.status === 304) return { notModified: true, etag: etag ?? null, milestones: [] }
  if (!res.ok) throw new Error(`list milestones failed: ${res.status} ${await res.text()}`)
  const firstEtag = res.headers.get('ETag')
  const milestones = (await res.json()) as GhMilestone[]
  let url = nextLink(res.headers.get('Link'))
  while (url) {
    const r = await fetch(url, { headers: ghHeaders(token) })
    if (!r.ok) throw new Error(`list milestones page failed: ${r.status} ${await r.text()}`)
    milestones.push(...((await r.json()) as GhMilestone[]))
    url = nextLink(r.headers.get('Link'))
  }
  return { notModified: false, etag: firstEtag, milestones }
}

export interface CreatedIssue {
  number: number
  html_url: string
}

/**
 * Create an issue via the App (moderation write-back #32). GitHub auto-creates a missing label,
 * so `via:vista` needs no separate ensure step. `milestone` is the GitHub milestone number.
 */
export async function createIssue(
  token: string,
  owner: string,
  repo: string,
  input: { title: string; body?: string; labels?: string[]; milestone?: number },
): Promise<CreatedIssue> {
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: ghHeaders(token, { 'Content-Type': 'application/json' }),
    body: JSON.stringify({ title: input.title, body: input.body, labels: input.labels, milestone: input.milestone }),
  })
  if (!res.ok) throw new Error(`create issue failed: ${res.status} ${await res.text()}`)
  const j = (await res.json()) as CreatedIssue
  return { number: j.number, html_url: j.html_url }
}

/** Issues (state=all, sort=updated asc), optionally `since` (ISO). Excludes PRs. Follows pagination. */
export async function listIssues(token: string, owner: string, repo: string, since?: string | null): Promise<GhIssue[]> {
  const base = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=all&sort=updated&direction=asc&per_page=100`
  let url: string | null = since ? `${base}&since=${encodeURIComponent(since)}` : base
  const out: GhIssue[] = []
  while (url) {
    const r = await fetch(url, { headers: ghHeaders(token) })
    if (!r.ok) throw new Error(`list issues failed: ${r.status} ${await r.text()}`)
    for (const it of (await r.json()) as GhIssue[]) {
      if (!it.pull_request) out.push(it) // drop PRs
    }
    url = nextLink(r.headers.get('Link'))
  }
  return out
}
