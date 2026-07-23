/**
 * Shared auth for Edge Functions (audit finding C-5 / P0-D).
 *
 * Every function in this project is invoked by trusted server-side callers
 * only (Supabase DB webhooks or pg_cron via net.http_post) — never directly
 * by the mobile client. Each caller must present a shared secret in the
 * `x-webhook-secret` header, configured once via:
 *
 *   supabase secrets set WEBHOOK_SECRET=<long random value>
 *
 * and attached to each webhook/cron definition as a custom HTTP header.
 *
 * Fail-closed: if WEBHOOK_SECRET is not configured in the function's
 * environment, every request is rejected (500) rather than allowed through.
 */

function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ab.length; i++) diff |= ab[i] ^ bb[i];
  return diff === 0;
}

/** Returns an error Response to send back, or null if the caller is authorized. */
export function requireWebhookSecret(req: Request): Response | null {
  const configured = Deno.env.get('WEBHOOK_SECRET');
  if (!configured) {
    return new Response(
      JSON.stringify({ error: 'WEBHOOK_SECRET not configured; refusing unauthenticated invocation' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const provided = req.headers.get('x-webhook-secret');
  if (!provided || !timingSafeEqual(provided, configured)) {
    return new Response(
      JSON.stringify({ error: 'unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } },
    );
  }
  return null;
}
