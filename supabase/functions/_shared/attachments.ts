// Attachment re-hosting (#262): GitHub private-repo attachment images (`user-attachments/assets/<uuid>`)
// are auth-gated, so Vista clients (not GitHub collaborators) get a 404. Here we fetch each one with the
// owner's user token (#262a), upload it to the public `attachments` Storage bucket, and rewrite the
// markdown body to point at the public URL. Idempotent + deduped via the github_attachments map, so the
// hourly sync never re-downloads. Legacy `user-images.githubusercontent.com` (already public) and any
// external URLs are left untouched. Any single failure leaves the original URL (graceful, #261 placeholder).
import { type SupabaseClient } from 'npm:@supabase/supabase-js@2'
import { getValidOwnerToken } from './github.ts'

const BUCKET = 'attachments'
const MAX_BYTES = 25 * 1024 * 1024 // skip anything implausibly large for an issue screenshot

/** Fresh regex each call (global flag is stateful — avoid sharing lastIndex across matchAll/replace). */
const attachmentRe = () => /https:\/\/github\.com\/user-attachments\/assets\/([0-9a-fA-F-]+)/g

function storageBase(): string {
  // Edge SUPABASE_URL is the internal host (kong) in local dev — not browser-reachable. STORAGE_PUBLIC_BASE
  // overrides it locally; in prod SUPABASE_URL is already the public origin. Rebuilt every sync from the
  // stored key, so the host self-heals if it ever changes.
  return (Deno.env.get('STORAGE_PUBLIC_BASE') ?? Deno.env.get('SUPABASE_URL') ?? '').replace(/\/+$/, '')
}

function publicUrl(storagePath: string): string {
  return `${storageBase()}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

/** Collect the distinct asset UUIDs referenced (markdown `![](…)` and HTML `<img src>` share the URL). */
export function collectAssetKeys(bodies: (string | null | undefined)[]): Set<string> {
  const keys = new Set<string>()
  for (const b of bodies) {
    if (!b) continue
    for (const m of b.matchAll(attachmentRe())) keys.add(m[1])
  }
  return keys
}

/** Replace every re-hosted attachment URL with its public Storage URL. Unmapped URLs are left as-is. */
export function rewriteBody(body: string | null, map: Map<string, string>): string | null {
  if (!body || map.size === 0) return body
  return body.replace(attachmentRe(), (full, key) => map.get(key) ?? full)
}

/** For each asset key not already hosted, fetch (owner token) -> upload -> record. Returns key -> public URL. */
async function ensureRehosted(admin: SupabaseClient, token: string, keys: Set<string>): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const { data: existing } = await admin.from('github_attachments').select('asset_key, storage_path').in('asset_key', [...keys])
  const have = new Set<string>()
  for (const r of (existing ?? []) as { asset_key: string; storage_path: string }[]) {
    map.set(r.asset_key, publicUrl(r.storage_path))
    have.add(r.asset_key)
  }
  for (const key of keys) {
    if (have.has(key)) continue
    try {
      const res = await fetch(`https://github.com/user-attachments/assets/${key}`, {
        headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'vista' },
        redirect: 'follow',
      })
      if (!res.ok) {
        console.error(`[attachments] fetch ${key} -> ${res.status}; leaving original URL`)
        continue
      }
      const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
      if (!contentType.startsWith('image/')) {
        console.error(`[attachments] ${key} is ${contentType}, not an image; skipping`)
        continue
      }
      const buf = new Uint8Array(await res.arrayBuffer())
      if (buf.byteLength > MAX_BYTES) {
        console.error(`[attachments] ${key} too large (${buf.byteLength} bytes); skipping`)
        continue
      }
      const { error: upErr } = await admin.storage.from(BUCKET).upload(key, buf, { contentType, upsert: true })
      if (upErr) {
        console.error(`[attachments] upload ${key} failed: ${upErr.message}`)
        continue
      }
      await admin
        .from('github_attachments')
        .upsert({ asset_key: key, storage_path: key, content_type: contentType, byte_size: buf.byteLength }, { onConflict: 'asset_key' })
      map.set(key, publicUrl(key))
    } catch (e) {
      console.error(`[attachments] rehost ${key} threw: ${e instanceof Error ? e.message : e}`)
    }
  }
  return map
}

/**
 * High-level entry for sync/webhook: from a batch of bodies, re-host any GitHub attachment images and
 * return a key -> public-URL map to feed into the projection rewrite. Returns an empty map (no rewrite)
 * if there are no attachments or the owner token is unavailable (never re-authorized / refresh failed).
 */
export async function rehostBodies(admin: SupabaseClient, installationId: number, bodies: (string | null | undefined)[]): Promise<Map<string, string>> {
  const keys = collectAssetKeys(bodies)
  if (keys.size === 0) return new Map()
  let token: string | null
  try {
    token = await getValidOwnerToken(admin, installationId)
  } catch (e) {
    console.error(`[attachments] owner token unavailable for installation ${installationId}: ${e instanceof Error ? e.message : e}`)
    return new Map()
  }
  if (!token) return new Map()
  return ensureRehosted(admin, token, keys)
}
