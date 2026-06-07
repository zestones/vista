// CORS for browser-invoked Edge Functions. Defaults open for local dev; set APP_ORIGIN
// to the app origin (e.g. https://app.vista...) to restrict it in deployed environments.
const ALLOWED_ORIGIN = Deno.env.get('APP_ORIGIN') ?? '*'

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
