// Typed access to client env (VITE_*). NEVER put secrets here — these are bundled.
// See docs: Architecture/Déploiement & environnements + Sécurité & modèle de menaces.

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? 'http://localhost:54321',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'public-anon-key',
  appUrl: import.meta.env.VITE_APP_URL ?? window.location.origin,
  /** mock | supabase — lets the data layer swap without touching the UI. */
  backend: (import.meta.env.VITE_BACKEND ?? 'mock') as 'mock' | 'supabase',
} as const
