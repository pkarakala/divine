# Divine — Claude Code Context

This file provides full context for any Claude Code session working on this project.

## What Is Divine?

An exclusive dating app for the Divine 9 (NPHC — National Pan-Hellenic Council). Nine historically Black fraternities and sororities with ~2.5M lifetime members. Verified membership required to join. Modeled after Raya's exclusivity with Hinge's intentional design.

## Owner

Pranav Reddy (pkarakala on GitHub). Solo founder/developer. Works across multiple devices — all development must be cloud-build compatible (EAS Build). Never assume local Xcode/Android Studio is available.

## Tech Stack

- **App:** Expo (React Native) + TypeScript + Expo Router
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **State:** Zustand
- **Payments:** RevenueCat (Apple/Google IAP abstraction)
- **Push:** Expo Notifications
- **CI/CD:** EAS Build + GitHub Actions
- **Monitoring:** Sentry
- **Analytics:** Mixpanel or PostHog

## Project Structure

```
divine/
├── app/                  # Screens (Expo Router file-based routing)
│   ├── auth/             #   Login, signup, forgot password
│   ├── onboarding/       #   Profile creation + verification upload
│   ├── (tabs)/           #   Discover, likes, matches, events, profile
│   ├── chat/             #   Match conversations
│   └── settings/         #   Account, preferences, report/block, legal
├── assets/               # Images, fonts
├── components/           # Reusable UI components
├── constants/            # Theme, config (demo creds come from env)
├── lib/                  # Supabase client, scoring, blocking, notifications, ...
├── stores/               # Zustand stores (auth, discovery, match)
├── scripts/              # verify-rls-hardening, seed (guarded), check-db
├── supabase/
│   ├── schema.sql        #   Base schema (historical; drifted — see migrations)
│   ├── migrations/       #   0001-0007 idempotent migrations = policy source of truth
│   └── functions/        #   Edge Functions (shared-secret auth; see functions/README.md)
├── docs/                 # Research, roadmap, architecture, AUDIT-HANDOFF.md
├── .github/workflows/    # CI (typecheck + bundle check)
├── app.json / eas.json   # Expo + EAS build config
└── package.json          # Dependencies
```

## Key Documents (Read These First)

1. `docs/roadmap/product-roadmap.md` — Feature breakdown by phase, current status
2. `docs/architecture/technical-architecture.md` — Data model, system diagram, ADRs
3. `docs/research/market-analysis.md` — TAM, demographics, opportunity scoring
4. `docs/research/revenue-model.md` — Pricing, projections, unit economics
5. `docs/research/competitive-analysis.md` — Raya, Tinder, Hinge lessons
6. `docs/research/growth-strategy.md` — Launch playbook, city expansion

## Current Phase

**Phase 1: Pre-launch hardening.** Core features are built (auth, onboarding, discovery,
matching, messaging, events, verification upload). A full security audit
(`docs/AUDIT-HANDOFF.md`) has been remediated: all P0 and most P1 items are done and
**applied to the live Supabase project**.

### Server-enforced trust & safety (do not regress these)
- Migrations `supabase/migrations/0001`–`0007` are the source of truth for policies;
  `schema.sql` is the base schema only. Migrations are idempotent; apply in order.
- Matches are created ONLY by a DB trigger on reciprocal like/rose — clients cannot
  INSERT into `matches`.
- Exact `latitude`/`longitude` never reach clients: discovery reads the
  `profiles_discovery` view (intentionally SECURITY DEFINER — its column list is the
  security boundary), distance via the `distance_bucket` RPC.
- `users` privileged columns (`is_verified`, `verification_status`, `subscription_tier`)
  are service-role/admin-only. Blocking, rate limits, and moderation are server-enforced.
- Edge Functions require an `x-webhook-secret` header (`_shared/auth.ts`); the secret
  lives in the `WEBHOOK_SECRET` function secret and gitignored `.webhook-secret.local`.
- Run `npm run verify-rls` after any policy change — 21 live checks must pass.

### Immediate Next Steps (in order)
1. Sentry crash reporting (before any external users)
2. Privacy policy / ToS + 18+ age gate (App Store requirements)
3. First EAS development build → TestFlight beta (Atlanta cohort)
4. RevenueCat integration (paywall is currently UI-only)

## Development Commands

```bash
npm install               # Install dependencies
npx expo start            # Start dev server (use Expo Go to test)
npm run typecheck         # tsc --noEmit — run after every change
npm run bundle-check      # expo export --platform ios — run before committing
npm run verify-rls        # live security suite against Supabase (needs demo creds in .env)
npx eas-cli build --platform ios --profile development  # Cloud build (EAS project linked)
npx supabase functions deploy <name> --no-verify-jwt    # Deploy an Edge Function
```

## Design Principles

1. **Women first** — Every UX decision prioritizes women's safety and comfort
2. **Quality over quantity** — Limited daily interactions force intentionality
3. **Verification is trust** — The org badge is everything
4. **Community, not just dating** — Celebrate D9 culture in prompts, events, features
5. **Density before breadth** — 500 users in one city > 5,000 across 50
6. **Design for deletion** — Success = couples leave the app

## Brand & Aesthetics

- Primary color: Deep navy (#0D0D14) — sophistication, exclusivity (see `constants/Theme.ts` / `app.json`)
- Accent: Gold (#C9A96E) — Greek letters, prestige
- Typography: Clean, modern sans-serif
- Tone: Warm, confident, culturally aware, not corporate
- Photography: Real people, authentic moments, Greek life celebrations

## Business Model

- Free: 5 likes/day
- Divine+ ($14.99/mo): Unlimited likes, see who liked you, filters
- Divine Elite ($29.99/mo): Priority matching, boosts, events, daily "Most Compatible"
- Revenue from: subscriptions (80-85%), IAP roses/boosts (10-15%), events (5%)

## Important Context

- App targets iOS App Store AND Google Play (cross-platform is non-negotiable)
- Verification is manual for MVP: admin approves in the Supabase Dashboard by setting
  `verification_status`/`is_verified` on `public.users` (admin writes pass the guard
  trigger; client writes cannot touch these columns)
- Launch city is Atlanta (Morehouse, Spelman, large D9 community)
- Gender ratio must stay 40-60% women — design decisions should protect this
- EAS Build is required (owner works from multiple devices, no guaranteed local build tools)
- All code changes must be committed and pushed to GitHub
- This project is designed so anyone with zero context can clone, read docs, and continue
  (`.env.example` is tracked; fill it from Supabase Dashboard → Settings → API)
- DB changes ship as new idempotent files in `supabase/migrations/` which the owner pastes
  into the Supabase SQL Editor — never modify applied migrations, never apply from session
