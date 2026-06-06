/** Stub for the supabase backend branch until Phase 2 wires the real calls. */
export function notImplemented(method: string): never {
  throw new Error(`[backend=supabase] ${method} is not implemented yet (Phase 2).`)
}
