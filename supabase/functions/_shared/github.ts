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
