// CORS for browser-invoked Edge Functions. Set APP_ORIGIN to the app origin
// (e.g. https://app.vista...) to restrict cross-origin browser access. (#186 / S3)
//
// We deliberately do NOT fail closed: S3 is defense-in-depth only (the JWT check gates every call
// regardless of Origin), and the browser-invoked functions (connect-installation, connect-repos,
// create-issue) would all break if a deploy forgot APP_ORIGIN. Instead we keep '*' as the fallback
// and log a loud warning when hosted without APP_ORIGIN. Setting APP_ORIGIN to lock this down is a
// #44 pre-prod checklist item. Hosted Supabase always injects a *.supabase.co SUPABASE_URL; local
// `functions serve` injects a localhost/kong URL (so the warning stays quiet in dev).
const APP_ORIGIN = Deno.env.get('APP_ORIGIN')
const IS_HOSTED = (Deno.env.get('SUPABASE_URL') ?? '').includes('.supabase.co')
if (IS_HOSTED && !APP_ORIGIN) {
  console.error('[cors] APP_ORIGIN is not set in a hosted environment; CORS is open to "*". Set APP_ORIGIN to the app origin to restrict it.')
}
const ALLOWED_ORIGIN = APP_ORIGIN ?? '*'

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

/** Returns the preflight response for OPTIONS, else null (continue handling). */
export function preflight(req: Request): Response | null {
  return req.method === 'OPTIONS' ? new Response('ok', { headers: corsHeaders }) : null
}

/** JSON response carrying the CORS headers. */
export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
