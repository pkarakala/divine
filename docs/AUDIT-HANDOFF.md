# Divine — Technical Audit & Startup-Readiness Handoff

**Date:** 2026-07-22
**Auditor:** Claude (Fable 5), multi-agent audit + direct verification
**Scope:** Full codebase — boot path, security/RLS, dependencies, state/data, screens, Edge Functions, release config
**Verdict:** The app **compiles clean** (`tsc --noEmit` passes) and **bundles clean** (`expo export` for iOS succeeds, 4.8 MB Hermes bundle). It is *not* startup-grade yet: the entire trust-and-safety model is enforced client-side while the Supabase backend enforces almost nothing. For a dating app handling PII and private messages, that is the headline risk.

Every finding below was verified by reading the actual code (file:line cited). This is the single source of truth for the remediation work.

---

## How this audit was run

- 7 parallel reviewers, one per dimension, each reading the real files.
- 3 reviewers (security, Edge Functions, release-config) completed and returned 41 raw findings with heavy convergence on the "server enforces nothing" theme.
- The remaining dimensions (boot, deps, state, screens) plus every critical/high claim were verified directly by the main session against the source.
- Findings that could not be confirmed in code were dropped.

---

## Verified facts (baseline — already checked this session)

| Check | Result |
|---|---|
| `npx tsc --noEmit` | ✅ passes, 0 errors |
| `npx expo export --platform ios` | ✅ succeeds, no bundling errors |
| `.env` tracked in git? | ✅ No (correctly gitignored) |
| Node-only `ws` package imported in app code? | ✅ No app imports (bundler safe; still an unused dep — see D-1) |
| `expo-secure-store` used for E2E keys? | ✅ Yes (`lib/encryption.ts`) — but the feature is unused (see H-1) |

---

## FINDINGS

Severity: **Critical** = exploitable now, breaks the core safety/trust promise. **High** = serious security/reliability gap or ships broken. **Medium** = correctness/readiness. **Low** = hygiene/docs.

### CRITICAL

**C-1 — Users can self-approve verification and grant themselves paid tiers.**
`supabase/schema.sql:198` — `CREATE POLICY "Users can update own data" ON public.users FOR UPDATE USING (auth.uid() = id)` with **no `WITH CHECK` and no column restriction**. A user can `UPDATE users SET is_verified = true, verification_status = 'approved', subscription_tier = 'elite' WHERE id = auth.uid()`. This defeats the entire premise of the app (verified membership) and gives away all paid features for free.
*Fix:* Remove client UPDATE on privileged columns. Either (a) split into a policy that only allows updating a safe subset (e.g. `gender`, `looking_for`, `email`, `phone_number`) via a `WITH CHECK` that the app can't use to touch `is_verified`/`verification_status`/`subscription_tier`, or (b) revoke UPDATE entirely and route those mutations through a trusted Edge Function / DB trigger with the service role. Subscription tier must only ever be set server-side from a verified RevenueCat webhook.

**C-2 — Any user can force a match with anyone; mutual-match logic is client-side only.**
`supabase/schema.sql:222` — `CREATE POLICY "System creates matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() = user_1_id OR auth.uid() = user_2_id)`. A user can insert a `matches` row pairing themselves with any target, then message them (messages policy at `:229` only checks match membership + active status). This enables unsolicited DMs to anyone — a direct harassment vector and a violation of the "women-first / mutual consent" design principle.
*Fix:* Revoke client INSERT on `matches`. Create matches only from a `SECURITY DEFINER` trigger on `interactions` that fires when a reciprocal `like`/`rose` exists, or from the `on-new-like` Edge Function using the service role. Client should never insert into `matches`.

**C-3 — Verification proof documents (membership cards / PII) are stored in a bucket read via public URLs.**
`app/onboarding/verification.tsx:101-102` — proof images upload to the `verifications` bucket and immediately call `getPublicUrl(...)`. If that bucket is public (as the code assumes), anyone with the URL can view government-adjacent ID / membership documents. Even unguessable URLs are enumerable and leak via logs.
*Fix:* Make the `verifications` bucket **private**. Upload with the authenticated client, store only the `storage_path` (not a public URL) in the `verifications.proof_url` column, and generate short-lived signed URLs (`createSignedUrl`) server-side for admin review only. Add a Storage RLS policy so users can only write their own path and cannot read others'.

**C-4 — Blocking is client-side only and non-functional; `reports` has no SELECT policy.**
`lib/blockList.ts` performs blocking in-app; `supabase/schema.sql:247` defines only an INSERT policy on `reports` ("Users can report") — **no SELECT policy**, so the app can't even read back the block list, and nothing server-side prevents a blocked user from still appearing in discovery, matching, or messaging. Blocking that doesn't actually block is a safety failure.
*Fix:* Add a dedicated `blocks` table (reporter → blocked) with RLS (owner can select/insert/delete own rows). Enforce blocks server-side: exclude blocked pairs from discovery queries, forbid match creation between blocked users (in the C-2 trigger), and forbid messages (add a `NOT EXISTS (blocks…)` clause to the messages INSERT policy). Keep `reports` for moderation separately.

**C-5 — `send-notification` Edge Function is an open push-spoofing endpoint.**
`supabase/functions/send-notification/index.ts:13-19` — reads `{ userId, title, body }` straight from the request body and sends a push to that user's tokens using the **service role key**, with **no JWT verification and no check that the caller is allowed to notify that user**. Anyone who can reach the function URL can spam arbitrary push notifications to any user with any content (phishing surface).
*Fix:* Verify the caller. For webhook-triggered functions, validate a shared secret header (Supabase DB webhook signature) or require the service role. For anything client-invocable, verify the JWT and derive `senderId` from it — never trust `userId` from the body for authorization. The same pattern must be applied to **all** functions under `supabase/functions/` (`moderate-photo`, `on-new-like`, `on-new-match`, `on-new-message`, `recompute-scores`, `expire-matches`).

### HIGH

**H-1 — E2E encryption is dead code; all messages stored in plaintext while the UI implies encryption.**
`stores/matchStore.ts:99-101` — `sendMessage` inserts `content` as-is (plaintext) into `messages`. The chat screen imports `decryptReceivedMessage`/`publishPublicKey` (`app/chat/[matchId].tsx:10`) but the send path never encrypts. So `lib/encryption.ts` + `lib/encryptedChat.ts` exist and are wired to SecureStore correctly, but are never used to protect stored messages. Messages sit in plaintext in Postgres, readable by anyone with DB/service-role access.
*Fix:* Decide the model. Either (a) **remove** the encryption modules and don't claim E2E anywhere (simplest for MVP; rely on RLS + Supabase encryption-at-rest), or (b) actually encrypt in `sendMessage` using the recipient's `public_key` and decrypt on read. Do not ship a half-wired crypto path that implies a guarantee it doesn't provide.

**H-2 — Exact GPS coordinates + full profiles of every user readable by any authenticated account.**
`supabase/schema.sql:201` — `"Profiles are viewable by authenticated" … USING (true)` exposes every column of every profile, including `latitude`/`longitude` (`:31-32`), `employer`, `education_school`, `line_name`, etc., to any logged-in user via direct PostgREST query — regardless of discovery filters. Precise location of every user is a stalking risk.
*Fix:* Don't store/serve exact coordinates to clients — store a coarse geohash or city centroid, or compute distance server-side (RPC) and return only a bucketed distance. Restrict the broad profile SELECT: expose a discovery **view** with only the fields discovery needs, and gate sensitive fields (exact location, contact) behind a match. At minimum drop `latitude`/`longitude` from any client-readable surface.

**H-3 — All rate limiting and daily like limits are client-side, in-memory only.**
`lib/rateLimit.ts` enforces limits in JS state; nothing in `schema.sql` or the Edge Functions enforces the free-tier "5 likes/day" or any abuse throttle. A trivial script (or app restart) bypasses all of it — breaks the monetization model and opens spam/abuse.
*Fix:* Enforce server-side. Add a DB function/trigger on `interactions` INSERT that counts today's likes for the sender and rejects over-limit for free tier (respecting `subscription_tier`). Consider a `daily_usage` table. Keep the client check only as UX.

**H-4 — Working production account credentials committed to the public repo and shipped in the bundle.**
`constants/demo.ts:1-4` — `demo@divine-test.com` / `DivineDemo2026!` hardcoded, imported by the login screen's "Try Demo Account" button, and pushed to the public GitHub repo (`docs/HANDOFF.md` also lists them). Anyone can log into that production account; it's a real account against the live Supabase project.
*Fix:* Remove the credentials from source. For a reviewer/demo path, gate it behind `__DEV__` only, or use a build-time env var, and rotate the password now. Never ship real login credentials in a client bundle or public repo. (The Supabase **anon** key is public by design — that one is fine.)

**H-5 — Push notifications will fail in production builds — no EAS `projectId` configured.**
`lib/notifications.ts:47,65` reads `Constants.expoConfig?.extra?.eas?.projectId`, but `app.json` has no `extra.eas.projectId` and there is **no `eas.json`** in the repo. `getExpoPushTokenAsync` will throw/return nothing in a production build, so no device ever registers for push — the entire notification system (a core re-engagement loop) silently no-ops.
*Fix:* Create the EAS project (`eas init`), add `eas.json` with `development`/`preview`/`production` profiles, and set `extra.eas.projectId` in `app.json`. Guard `getExpoPushTokenAsync` so a missing projectId logs instead of crashing boot.

**H-6 — Fresh clone cannot boot: `.env.example` is gitignored, so there's no env template.**
`.gitignore:35` — `.env.*` matches `.env.example`, and `git ls-files` confirms it is **not tracked**. A teammate cloning the repo gets no `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` template; `lib/supabase.ts:5-6` then falls back to empty strings and every Supabase call fails at runtime with an opaque error. This directly contradicts the project's "anyone can clone and continue" principle.
*Fix:* Add an explicit un-ignore rule: `!.env.example` in `.gitignore`, then `git add -f .env.example` and commit it (with placeholder values only). Document env setup in `README.md`.

### MEDIUM

**M-1 — Dev Tools (Seed / Clear Mock Data, Experiments) visible to all users in production.**
`app/(tabs)/profile.tsx:205-219` renders a "Dev Tools" section with "Seed Mock Data" and "Clear Seed Data" (calls `clearSeedData()` from `lib/seed.ts`) to every user. A real user can seed or wipe demo data against the live backend.
*Fix:* Wrap the entire Dev Tools block in `{__DEV__ && ( … )}` so it's stripped from production builds.

**M-2 — Scheduled/webhook server logic is never actually wired — it exists only as SQL comments.**
`supabase/schema.sql:323-331` — the webhook triggers (`matches→on-new-match`, `messages→on-new-message`, `interactions→on-new-like`) and cron jobs (`recompute-scores`, `expire-matches`) are **commented-out documentation**, not real configuration. So matches never expire, scores never recompute, and no notifications fire on new like/match/message even though the Edge Functions exist.
*Fix:* Configure the DB webhooks (Supabase Dashboard → Database → Webhooks) and `pg_cron` jobs for real, and check the wiring into the repo as a runnable migration/SQL file so it's reproducible, not tribal knowledge. Add auth per C-5 before enabling.

**M-3 — `update_last_active()` trigger is defined but never attached.**
`supabase/schema.sql:264-270` defines the function; no `CREATE TRIGGER` uses it. `last_active_at` stays at its signup default forever, so "active recently" sorting/filtering and the activity score are meaningless.
*Fix:* Either attach it appropriately or (better, since a trigger on every read is awkward) update `last_active_at` from the app on foreground / session start, or from an authenticated heartbeat. Remove the dead function if unused.

**M-4 — Auth session (refresh token) persisted in unencrypted AsyncStorage.**
`lib/supabase.ts:23` uses `AsyncStorage` as the Supabase auth storage on native. Refresh tokens sit in plaintext app storage. `expo-secure-store` is already a dependency and used elsewhere (`lib/encryption.ts`).
*Fix:* Provide a SecureStore-backed storage adapter to `createClient({ auth: { storage } })` on native (chunk if >2 KB), keeping AsyncStorage/localStorage only for web.

**M-5 — `user_scores` desirability is client-writable and world-readable.**
`supabase/schema.sql:320-321` — `"Scores readable by authenticated" USING (true)` (everyone can read everyone's desirability/selectivity scores) and `"System updates scores" FOR ALL USING (auth.uid() = user_id)` lets a user **write their own** ranking scores to game Standouts/ordering.
*Fix:* Revoke client write on `user_scores` (compute only via the service-role `recompute-scores` function). Restrict SELECT to the owner's own row (or don't expose raw scores to clients at all).

**M-6 — Store-readiness gaps in `app.json`.**
`app.json` has no iOS `infoPlist` permission purpose strings (camera, photo library, location, notifications) — the app uses `expo-image-picker`, `expo-location`, `expo-notifications`, so **Apple will reject the build** without `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSLocationWhenInUseUsageDescription`. No `ITSAppUsesNonExemptEncryption` declaration. `associatedDomains`/`intentFilters` point at `divine.app` (`:13-16`, `:26-42`), a domain the project can't currently verify, so universal links silently fail.
*Fix:* Add `ios.infoPlist` purpose strings and `ITSAppUsesNonExemptEncryption: false` (or true + declare). Either register/verify `divine.app` with an AASA file + Android Digital Asset Links, or remove the deep-link config until the domain is ready.

**M-7 — Claimed stack is largely not implemented.**
`README.md`/`CLAUDE.md` claim Sentry, RevenueCat, Mixpanel/PostHog. None are in `package.json`; the paywall is a "Coming Soon" alert; there is no crash reporting or analytics pipeline (`lib/analytics.ts` is a local stub). This isn't a bug but it means "monetization" and "monitoring" don't exist yet.
*Fix:* Either implement (RevenueCat for IAP + tier sync per C-1, Sentry for crash reporting) or update the docs to reflect reality so the roadmap isn't misleading. At minimum add Sentry before launch.

**M-8 — Scripts default to the production Supabase project.**
`scripts/check-db.ts:5` hardcodes the prod URL; `scripts/seed-mock-data.ts:4` defaults to it and uses a **service role key** to seed mock data. Running these by accident writes mock users into production.
*Fix:* Require an explicit env var with no prod default; print the target URL and require a confirmation flag before writing. Never embed the prod URL as a fallback.

### LOW

**L-1 — No lint / typecheck / test tooling.** `package.json` has only `expo start` variants — no `lint`, no `typecheck`, no `test`, no CI config. Nothing for a pipeline to run. *Fix:* Add ESLint (`eslint-config-expo`), a `typecheck` script (`tsc --noEmit`), Jest + `jest-expo`, and a minimal GitHub Actions workflow.

**L-2 — LICENSE mismatch.** `LICENSE` is Expo's MIT text while `README.md` declares "Proprietary. All rights reserved." *Fix:* Replace with the intended proprietary license or reconcile the README.

**L-3 — Stale docs.** `CLAUDE.md`/`README.md` list wrong phase status, outdated brand colors (navy `#1A1A2E` vs the actual `#0D0D14` in `app.json`), and an incomplete project structure. *Fix:* Refresh after remediation.

**L-4 — Analytics event-type bug.** `lib/experiments.ts` writes experiment exposure with `event_type: 'session_start'`, corrupting the analytics stream. *Fix:* Use a dedicated `experiment_exposure` event type (add it to the `analytics_events` CHECK constraint at `schema.sql:289`).

**L-5 — Edge Functions swallow errors.** `expire-matches`, `send-notification`, etc. ignore Expo push receipts and error returns, so failures are invisible. *Fix:* Check `error` on every Supabase call and log; inspect push receipts for `DeviceNotRegistered` and prune dead tokens.

**L-6 — `photo_moderation` fails open.** `moderate-photo` auto-approves when `GOOGLE_VISION_API_KEY` is unset, and its verdict is client-writable (`schema.sql:359` INSERT `WITH CHECK (auth.uid() = user_id)`). *Fix:* Fail closed (leave `pending`, require human review) and make moderation rows service-role-write-only.

---

## CONSOLIDATED IMPLEMENTATION PLAN

Grouped into work items, ordered by dependency within each tier.

### P0 — Must fix for a secure, startup-grade app (do first, in this order)

**P0-A. Lock down the database (RLS rewrite).** One migration file addressing C-1, C-2, H-2, M-5, L-4, L-6:
1. Restrict `users` UPDATE to non-privileged columns; move `is_verified`/`verification_status`/`subscription_tier` to service-role-only paths. (C-1)
2. Revoke client INSERT on `matches`; add a `SECURITY DEFINER` reciprocal-like trigger to create matches. (C-2)
3. Replace `profiles` `USING(true)` with a discovery view that omits exact `latitude`/`longitude`; serve bucketed distance only. (H-2)
4. Revoke client write on `user_scores`; restrict SELECT to owner. (M-5)
5. Make `photo_moderation` service-role-write-only. (L-6)
6. Add `experiment_exposure` to the `analytics_events` CHECK. (L-4)

**P0-B. Secure the storage buckets.** Make `verifications` (and ideally `photos`) private; switch `app/onboarding/verification.tsx` to store `storage_path` + signed URLs; add Storage RLS. (C-3)

**P0-C. Real, server-enforced blocking.** New `blocks` table + RLS; enforce in discovery queries, the match trigger, and the messages INSERT policy. (C-4)

**P0-D. Authenticate every Edge Function.** Add JWT / webhook-secret verification to all `supabase/functions/*`; derive identity from the token, never from the body. (C-5, and prerequisite for M-2)

**P0-E. Server-side rate limiting.** DB trigger enforcing daily like limits by `subscription_tier`. (H-3)

**P0-F. Remove shipped secrets & demo creds.** Delete/`__DEV__`-gate `constants/demo.ts`; rotate the demo password; scrub `docs/HANDOFF.md`. (H-4)

**P0-G. Decide the encryption story.** Either remove the crypto modules and stop implying E2E, or actually encrypt in `sendMessage`. Don't ship it half-wired. (H-1)

### P1 — Fix before launch (reliability + store acceptance)

- **P1-A.** Create `eas.json` + `extra.eas.projectId`; guard `getExpoPushTokenAsync`. (H-5)
- **P1-B.** Un-ignore and commit `.env.example`; document env setup in README. (H-6)
- **P1-C.** Actually wire the DB webhooks + `pg_cron` jobs as a checked-in migration; enable only after P0-D. (M-2)
- **P1-D.** `__DEV__`-gate the Dev Tools card. (M-1)
- **P1-E.** Add iOS `infoPlist` purpose strings + encryption declaration; fix or remove `divine.app` deep links. (M-6)
- **P1-F.** SecureStore-backed auth storage adapter. (M-4)
- **P1-G.** Fix `last_active_at` updating. (M-3)
- **P1-H.** Add Sentry (crash reporting) at minimum; reconcile RevenueCat/analytics claims. (M-7)
- **P1-I.** Make seed/check scripts require explicit non-prod target + confirmation. (M-8)

### P2 — Backlog / hygiene

- **P2-A.** ESLint + `typecheck`/`test` scripts + GitHub Actions CI. (L-1)
- **P2-B.** Fix LICENSE vs README. (L-2)
- **P2-C.** Refresh `CLAUDE.md`/`README.md` after remediation. (L-3)
- **P2-D.** Error handling + push-receipt pruning in Edge Functions. (L-5)
- **P2-E.** Remove unused `ws` dependency (no app imports). (D-1)

---

## HANDOFF PROMPT (paste into a fresh session to implement)

> I'm working on the **Divine** app at `~/divine` (Expo/React Native + TypeScript + Expo Router, Supabase backend, Zustand). It's a pre-launch dating app for the Divine 9. A full technical audit is written up in `docs/AUDIT-HANDOFF.md` — **read that file first**; it has every finding with file:line and a P0/P1/P2 plan.
>
> Start with **P0-A (the RLS rewrite)**. Produce a single new SQL migration file under `supabase/` that: (1) restricts `users` UPDATE so clients can't set `is_verified`/`verification_status`/`subscription_tier`; (2) revokes client INSERT on `matches` and adds a `SECURITY DEFINER` trigger that creates a match only when a reciprocal like/rose exists; (3) replaces the `profiles` `USING(true)` SELECT with a discovery view that omits exact lat/long; (4) makes `user_scores` and `photo_moderation` service-role-write-only and scopes score reads to the owner. Don't apply it to the live DB — just write the migration and explain how to run it. Keep the existing `schema.sql` as the base and write the migration as an additive/idempotent `ALTER`/`DROP POLICY`/`CREATE POLICY` script. After the migration, update `stores/matchStore.ts` / `app/onboarding/verification.tsx` etc. only as needed to match the new server contract.
>
> Constraints: EAS Build only (I work across devices, no guaranteed local Xcode). Verify with `npx tsc --noEmit` and `npx expo export --platform ios` after code changes. Commit per logical change with clear messages; don't push unless I say so. Women-first safety is the top design priority.

---

## Appendix — files referenced

- Boot: `app/_layout.tsx`, `app/index.tsx`, `stores/authStore.ts`, `lib/supabase.ts`
- Security/RLS: `supabase/schema.sql`, `constants/demo.ts`, `lib/blockList.ts`, `lib/rateLimit.ts`, `lib/encryption.ts`, `lib/encryptedChat.ts`
- Edge Functions: `supabase/functions/{send-notification,moderate-photo,on-new-like,on-new-match,on-new-message,recompute-scores,expire-matches}/index.ts`
- Screens: `app/onboarding/verification.tsx`, `app/(tabs)/profile.tsx`, `app/chat/[matchId].tsx`, `stores/matchStore.ts`
- Config: `app.json`, `.gitignore`, `package.json`, `scripts/{check-db,seed-mock-data}.ts`, `lib/notifications.ts`, `lib/experiments.ts`
