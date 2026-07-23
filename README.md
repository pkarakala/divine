# Divine

**The exclusive dating app for the Divine 9.**

Divine is an exclusive dating platform built for members of the National Pan-Hellenic Council (NPHC) — the nine historically Black fraternities and sororities known as the Divine 9. Verified membership is required to join.

---

## What Is This?

A mobile dating app (iOS + Android) where D9 members connect with verified members of their community. Think Hinge's intentional design + Raya's exclusivity + the built-in trust of Greek life.

### The Divine 9 Organizations
- Alpha Phi Alpha (1906) | Alpha Kappa Alpha (1908)
- Kappa Alpha Psi (1911) | Omega Psi Phi (1911)
- Delta Sigma Theta (1913) | Phi Beta Sigma (1914)
- Zeta Phi Beta (1920) | Sigma Gamma Rho (1922)
- Iota Phi Theta (1963)

---

## Tech Stack

| Layer | Technology | Status |
|---|---|---|
| Mobile App | Expo (React Native) + TypeScript | ✅ live |
| Navigation | Expo Router (file-based) | ✅ live |
| State | Zustand | ✅ live |
| Backend | Supabase (PostgreSQL + RLS, Auth, Realtime, Storage, Edge Functions) | ✅ live |
| Push Notifications | Expo Notifications (DB webhooks → Edge Functions) | ✅ wired |
| CI | GitHub Actions (typecheck + bundle check) | ✅ live |
| Builds | EAS Build (project linked) | ✅ linked |
| Payments | RevenueCat | 🔜 planned |
| Analytics | local stub (`lib/analytics.ts`) → Mixpanel/PostHog | 🔜 planned |
| Monitoring | Sentry | 🔜 planned (pre-launch requirement) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- npm
- Expo Go app on your phone (for development testing)
- Git

### Setup
```bash
git clone https://github.com/pkarakala/divine.git
cd divine
npm install
cp .env.example .env   # then fill in the Supabase URL + anon key (Dashboard → Settings → API)
npx expo start
```

Optional `.env` extras: `EXPO_PUBLIC_DEMO_EMAIL` / `EXPO_PUBLIC_DEMO_PASSWORD` enable the
"Try Demo Account" button on the login screen (hidden when unset).

### Checks
```bash
npm run typecheck      # tsc --noEmit
npm run bundle-check   # expo export --platform ios
npm run verify-rls     # live RLS/security suite against Supabase (needs demo creds in .env)
```

Scan the QR code with Expo Go (Android) or Camera app (iOS) to run on your device.

### Cloud Builds (no local Xcode/Android Studio needed)
```bash
npx eas-cli build --platform ios --profile development
npx eas-cli build --platform android --profile development
```

---

## Project Structure

```
divine/
├── app/                    # Screens (Expo Router file-based routing)
│   ├── (tabs)/             # Tab navigation screens
│   ├── _layout.tsx         # Root layout
│   └── +not-found.tsx      # 404 screen
├── assets/                 # Images, fonts, static files
├── components/             # Reusable UI components
├── constants/              # Theme colors, config values
├── docs/                   # Project documentation
│   ├── research/           # Market analysis, competitive intel
│   ├── roadmap/            # Product roadmap with phases
│   ├── architecture/       # Technical decisions, data model
│   └── decisions/          # Architecture Decision Records
├── app.json                # Expo configuration
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
├── CLAUDE.md               # AI assistant context (for Claude Code sessions)
└── README.md               # This file
```

---

## Documentation

All research, decisions, and planning live in `/docs/`:

- **[Market Analysis](docs/research/market-analysis.md)** — TAM/SAM/SOM, demographics, competitive landscape
- **[Competitive Analysis](docs/research/competitive-analysis.md)** — Raya, Tinder, Hinge, The League deep-dive
- **[Revenue Model](docs/research/revenue-model.md)** — Pricing, projections, unit economics
- **[Growth Strategy](docs/research/growth-strategy.md)** — Launch playbook, city expansion, channels
- **[Product Roadmap](docs/roadmap/product-roadmap.md)** — Phase 0-4 feature breakdown
- **[Technical Architecture](docs/architecture/technical-architecture.md)** — Stack, data model, system design

---

## Current Status

**Phase 1: Pre-launch hardening** — Core features built (auth, onboarding, discovery,
matching, messaging, events, verification upload). Full security audit completed and
remediated (see `docs/AUDIT-HANDOFF.md`); trust and safety are enforced **server-side**:

- RLS locked down: privileged columns server-only, matches created only by a reciprocal-like
  DB trigger, exact location never client-readable (`profiles_discovery` view + bucketed
  `distance_bucket` RPC), scores/moderation service-role-write-only
- Blocking is server-enforced (blocks table checked in discovery, matching, likes, messages)
- Verification proofs in a private bucket, owner-scoped
- Edge Functions deployed with shared-secret auth; DB webhooks + pg_cron wired
- Server-side daily like limits by subscription tier
- Migrations live in `supabase/migrations/` (0001–0007, idempotent, applied in order)

### Next Steps
1. Sentry crash reporting (pre-launch requirement)
2. Privacy policy / ToS + 18+ age gate (App Store requirement)
3. First EAS development build → TestFlight beta (Atlanta cohort)
4. RevenueCat integration (subscriptions currently UI-only)

---

## Development Workflow

- **Branch strategy:** `main` (production) → `develop` (staging) → `feature/*` branches
- **Builds:** EAS Build for cloud builds (works from any device)
- **Updates:** EAS Update for OTA hot-fixes
- **Testing:** Expo Go for development, EAS preview builds for testing

---

## Business Model

- **Free tier:** 5 likes/day, basic matching
- **Divine+ ($14.99/mo):** Unlimited likes, see who liked you, advanced filters
- **Divine Elite ($29.99/mo):** Priority matching, weekly boost, event discounts, daily "Most Compatible" pick

Target: $500K-$1.5M ARR Year 1, scaling to $10M+ Year 3.

---

## License

Proprietary. All rights reserved.
