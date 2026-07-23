# Edge Functions

All functions are **server-invoked only** (DB webhooks or pg_cron) and reject
any request without the shared secret header (`x-webhook-secret`) — see
`_shared/auth.ts` and audit finding C-5 (docs/AUDIT-HANDOFF.md). They fail
closed: if `WEBHOOK_SECRET` is unset in the function environment, every
request is rejected.

| Function | Trigger | Purpose |
|---|---|---|
| `on-new-like` | webhook: `interactions` INSERT | push "someone likes you" |
| `on-new-match` | webhook: `matches` INSERT | push "it's a match" to both users |
| `on-new-message` | webhook: `messages` INSERT | push message preview to receiver |
| `moderate-photo` | webhook: `photos` INSERT | SafeSearch verdict → `photo_moderation` (fails closed to `pending`/`flagged`) |
| `send-notification` | internal (other functions / admin) | generic push to a user's tokens |
| `recompute-scores` | pg_cron (every 6h) | recompute `user_scores` (sole writer — M-5) |
| `expire-matches` | pg_cron (hourly) | expire message-less matches past `expires_at` |

## Deploy

```bash
# One-time: set the shared secret (generate a long random value)
supabase secrets set WEBHOOK_SECRET="$(openssl rand -hex 32)"

# Deploy all functions (from repo root; requires `supabase link` once)
supabase functions deploy on-new-like on-new-match on-new-message \
  moderate-photo send-notification recompute-scores expire-matches \
  --no-verify-jwt
```

`--no-verify-jwt` is intentional: callers are webhooks/cron, not user JWTs;
authentication is the `x-webhook-secret` header instead.

## Wire the webhooks (Dashboard → Database → Webhooks)

Create one webhook per row below. For each: **HTTP Request → POST**, add HTTP
header `x-webhook-secret: <the WEBHOOK_SECRET value>`.

| Table | Events | URL |
|---|---|---|
| `interactions` | INSERT | `https://<ref>.supabase.co/functions/v1/on-new-like` |
| `matches` | INSERT | `https://<ref>.supabase.co/functions/v1/on-new-match` |
| `messages` | INSERT | `https://<ref>.supabase.co/functions/v1/on-new-message` |
| `photos` | INSERT | `https://<ref>.supabase.co/functions/v1/moderate-photo` |

## Wire the cron jobs (SQL Editor; pg_cron + pg_net enabled)

```sql
SELECT cron.schedule('recompute-scores', '0 */6 * * *', $$
  SELECT net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/recompute-scores',
    headers := '{"Content-Type": "application/json", "x-webhook-secret": "<WEBHOOK_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);

SELECT cron.schedule('expire-matches', '0 * * * *', $$
  SELECT net.http_post(
    url := 'https://<ref>.supabase.co/functions/v1/expire-matches',
    headers := '{"Content-Type": "application/json", "x-webhook-secret": "<WEBHOOK_SECRET>"}'::jsonb,
    body := '{}'::jsonb
  );
$$);
```

## Verify after deploy

```bash
# No secret -> 401
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  https://<ref>.supabase.co/functions/v1/send-notification -d '{}'

# Wrong secret -> 401; correct secret -> 200
```
