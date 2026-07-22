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
├── app/              # Screens (Expo Router file-based routing)
├── assets/           # Images, fonts
├── components/       # Reusable UI components
├── constants/        # Theme, config
├── docs/             # All research, roadmap, architecture docs
│   ├── research/     # Market analysis, competitive intel, revenue model
│   ├── roadmap/      # Product roadmap (phases 0-4)
│   ├── architecture/ # Tech decisions, data model, system design
│   └── decisions/    # ADRs
├── app.json          # Expo config
├── package.json      # Dependencies
└── tsconfig.json     # TypeScript config
```

## Key Documents (Read These First)

1. `docs/roadmap/product-roadmap.md` — Feature breakdown by phase, current status
2. `docs/architecture/technical-architecture.md` — Data model, system diagram, ADRs
3. `docs/research/market-analysis.md` — TAM, demographics, opportunity scoring
4. `docs/research/revenue-model.md` — Pricing, projections, unit economics
5. `docs/research/competitive-analysis.md` — Raya, Tinder, Hinge lessons
6. `docs/research/growth-strategy.md` — Launch playbook, city expansion

## Current Phase

**Phase 0: Foundation** — Scaffolding complete, docs done, ready for feature development.

### Immediate Next Steps (in order)
1. Set up Supabase project (create tables from data model in architecture doc)
2. Implement authentication (phone/email via Supabase Auth)
3. Build onboarding/profile creation flow (D9 org, chapter, photos, prompts)
4. Implement discovery screen (card-based, like Hinge)
5. Build matching system (like/pass/rose + mutual match detection)
6. Implement messaging (Supabase Realtime)

## Development Commands

```bash
npm install          # Install dependencies
npx expo start      # Start dev server (use Expo Go to test)
npx expo start --ios    # iOS simulator
npx expo start --android  # Android emulator
npx eas-cli build --platform ios --profile development  # Cloud build
npx eas-cli build --platform android --profile development
```

## Design Principles

1. **Women first** — Every UX decision prioritizes women's safety and comfort
2. **Quality over quantity** — Limited daily interactions force intentionality
3. **Verification is trust** — The org badge is everything
4. **Community, not just dating** — Celebrate D9 culture in prompts, events, features
5. **Density before breadth** — 500 users in one city > 5,000 across 50
6. **Design for deletion** — Success = couples leave the app

## Brand & Aesthetics

- Primary color: Deep navy (#1A1A2E) — sophistication, exclusivity
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
- Verification is manual for MVP (admin reviews membership claims)
- Launch city is Atlanta (Morehouse, Spelman, large D9 community)
- Gender ratio must stay 40-60% women — design decisions should protect this
- EAS Build is required (owner works from multiple devices, no guaranteed local build tools)
- All code changes must be committed and pushed to GitHub
- This project is designed so anyone with zero context can clone, read docs, and continue
