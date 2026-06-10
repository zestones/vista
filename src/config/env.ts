// Typed access to client env (VITE_*). NEVER put secrets here — these are bundled.
// See docs: Architecture/Déploiement & environnements + Sécurité & modèle de menaces.

/**
 * Resolve the Supabase URL so the app works on both localhost and the LAN (phone testing) with no
 * hardcoded IP: when the configured URL is a LOCAL dev URL (localhost/127.0.0.1) but the page is
 * opened from another host (e.g. the LAN IP via `vite --host`), reuse the page's hostname — so the
 * phone talks to `http://<that-host>:54321`. Real (cloud) URLs and same-host access pass through.
 */
function resolveSupabaseUrl(): string {
  const configured = import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost:54321'
  if (typeof window === 'undefined') return configured
  const page = window.location.hostname
  if (page === 'localhost' || page === '127.0.0.1') return configured
  try {
    const url = new URL(configured)
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = page
      return url.origin
    }
  } catch {
    // configured isn't a valid absolute URL — leave it untouched.
  }
  return configured
}

export const env = {
  supabaseUrl: resolveSupabaseUrl(),
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key',
  appUrl: import.meta.env.VITE_APP_URL ?? window.location.origin,
  /** mock | supabase — lets the data layer swap without touching the UI. */
  backend: import.meta.env.VITE_BACKEND ?? 'mock',
} as const
