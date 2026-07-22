# Divine — Technical Architecture

## Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| **Mobile App** | Expo (React Native) + TypeScript | Cross-platform iOS + Android from single codebase; EAS Build for cloud builds |
| **Navigation** | Expo Router | File-based routing, deep linking support |
| **State Management** | Zustand | Lightweight, TypeScript-friendly, no boilerplate |
| **Backend** | Supabase | PostgreSQL, Auth, Realtime subscriptions, Storage, Edge Functions |
| **Realtime** | Supabase Realtime | WebSocket-based messaging, presence, typing indicators |
| **Storage** | Supabase Storage + CDN | Photo/video storage with image transformation |
| **Push Notifications** | Expo Notifications + FCM/APNs | Cross-platform push via Expo's unified API |
| **Analytics** | Mixpanel or PostHog | Event tracking, funnels, retention cohorts |
| **Payments** | RevenueCat | Subscription management, Apple/Google IAP abstraction |
| **CI/CD** | EAS Build + GitHub Actions | Cloud builds, OTA updates, automated testing |
| **Monitoring** | Sentry | Crash reporting, performance monitoring |

---

## Why This Stack

### Expo (React Native)
- **Cross-platform from day one** — can't afford separate iOS/Android teams as a solo founder
- **EAS Build** — cloud builds without local Xcode/Android Studio (critical for multi-device workflow)
- **OTA Updates** — push bug fixes without App Store review
- **Expo Router** — file-based navigation similar to Next.js
- **Rich ecosystem** — camera, location, notifications, biometrics all available as managed APIs

### Supabase (over Firebase)
- **PostgreSQL** — relational data model is better for complex matching queries
- **Row Level Security (RLS)** — fine-grained access control at the database level
- **Realtime** — WebSocket subscriptions for chat, presence, typing
- **Edge Functions** — serverless functions for business logic (matching, verification)
- **Open source** — no vendor lock-in, can self-host if needed
- **SQL** — familiar, powerful querying for analytics and matching algorithms
- **Cost** — generous free tier, predictable pricing at scale

### RevenueCat (for payments)
- Abstracts Apple/Google IAP complexity
- Handles subscription lifecycle (trials, renewals, cancellations, grace periods)
- Cross-platform receipt validation
- Revenue analytics dashboard
- Webhook integrations for backend sync

---

## Data Model (Core Entities)

```
┌─────────────────────────────────────────────────────┐
│                      USERS                           │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ phone_number (encrypted)                            │
│ email (encrypted)                                   │
│ created_at, updated_at                              │
│ is_verified (boolean)                               │
│ verification_status (pending/approved/rejected)     │
│ subscription_tier (free/plus/elite)                 │
│ last_active_at                                      │
│ gender (male/female/non-binary)                     │
│ looking_for (male/female/everyone)                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    PROFILES                          │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ user_id (FK → users)                                │
│ display_name                                        │
│ date_of_birth                                       │
│ bio (short text)                                    │
│ location (city, state)                              │
│ latitude, longitude                                 │
│ occupation                                          │
│ employer                                            │
│ education (school name, degree)                     │
│ height                                              │
│ organization (enum: 9 orgs)                         │
│ chapter_name                                        │
│ line_name                                           │
│ line_number                                         │
│ initiation_year                                     │
│ org_preference (same_org/any_d9/no_preference)      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    PHOTOS                            │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ user_id (FK → users)                                │
│ storage_path (Supabase Storage URL)                 │
│ order_index (1-6)                                   │
│ is_primary (boolean)                                │
│ created_at                                          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    PROMPTS                           │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ user_id (FK → users)                                │
│ prompt_question (text)                              │
│ prompt_answer (text, max 300 chars)                 │
│ order_index (1-3)                                   │
│ type (text/voice/video)                             │
│ media_url (nullable, for voice/video)               │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   INTERACTIONS                       │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ sender_id (FK → users)                              │
│ receiver_id (FK → users)                            │
│ type (like/pass/rose)                               │
│ target_type (photo/prompt)                          │
│ target_id (FK → photos or prompts)                  │
│ comment (text, required for likes)                  │
│ created_at                                          │
│ seen_at (nullable)                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    MATCHES                           │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ user_1_id (FK → users)                              │
│ user_2_id (FK → users)                              │
│ matched_at                                          │
│ expires_at (7 days if no message)                   │
│ status (active/expired/unmatched)                   │
│ we_met (nullable boolean, feedback)                 │
│ we_met_feedback (text)                              │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   MESSAGES                           │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ match_id (FK → matches)                             │
│ sender_id (FK → users)                              │
│ content (encrypted text)                            │
│ type (text/image/voice)                             │
│ media_url (nullable)                                │
│ created_at                                          │
│ read_at (nullable)                                  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                    EVENTS                            │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ title                                               │
│ description                                         │
│ location (venue, city, state)                       │
│ start_time, end_time                                │
│ capacity                                            │
│ ticket_price (nullable)                             │
│ organization_filter (nullable, specific org only)   │
│ created_by (FK → users, admin)                      │
│ image_url                                           │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                 VERIFICATIONS                        │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ user_id (FK → users)                                │
│ organization                                        │
│ chapter_name                                        │
│ proof_type (membership_card/letter/photo/other)     │
│ proof_url (Supabase Storage)                        │
│ status (pending/approved/rejected)                  │
│ reviewed_by (nullable, admin user_id)               │
│ reviewed_at                                         │
│ rejection_reason (nullable)                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│              BLOCKED_USERS / REPORTS                 │
├─────────────────────────────────────────────────────┤
│ id (uuid, PK)                                       │
│ reporter_id (FK → users)                            │
│ reported_id (FK → users)                            │
│ reason (enum: inappropriate/spam/fake/harassment)   │
│ details (text)                                      │
│ status (pending/reviewed/actioned)                  │
│ created_at                                          │
└─────────────────────────────────────────────────────┘
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENT (Mobile App)                     │
│                   Expo + React Native + TypeScript             │
│                                                               │
│  ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌───────┐ │
│  │Discover │ │  Likes   │ │ Matches │ │ Events │ │Profile│ │
│  └─────────┘ └──────────┘ └─────────┘ └────────┘ └───────┘ │
│                                                               │
│  ┌──────────────────────────────────────────────────────────┐│
│  │            Zustand (State Management)                     ││
│  └──────────────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────────────┐│
│  │    RevenueCat SDK  │  Expo Notifications  │  Sentry SDK  ││
│  └──────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS / WebSocket
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        SUPABASE                               │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │     Auth     │  │   Realtime   │  │   Edge Functions   │ │
│  │ (phone/email)│  │  (WebSocket) │  │  (business logic)  │ │
│  └──────────────┘  └──────────────┘  └────────────────────┘ │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │
│  │  PostgreSQL  │  │   Storage    │  │   Row Level        │ │
│  │  (database)  │  │(photos/media)│  │   Security (RLS)   │ │
│  └──────────────┘  └──────────────┘  └────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
     ┌──────────────┐ ┌────────────┐ ┌──────────────┐
     │  RevenueCat  │ │   Sentry   │ │   Mixpanel   │
     │ (payments)   │ │ (crashes)  │ │ (analytics)  │
     └──────────────┘ └────────────┘ └──────────────┘
```

---

## Key Technical Decisions

### ADR-001: Expo over bare React Native
- **Decision:** Use Expo managed workflow
- **Rationale:** Solo developer needs maximum productivity. EAS Build eliminates need for local Xcode/Android Studio. OTA updates allow hot-fixing without App Store review. The trade-off (less native module control) is acceptable for MVP.
- **Revisit when:** We need a native module not supported by Expo (unlikely for dating app features)

### ADR-002: Supabase over Firebase
- **Decision:** Use Supabase for backend
- **Rationale:** PostgreSQL is better for complex matching queries (geospatial, multi-filter). RLS provides security at the database layer. Open source means no vendor lock-in. SQL familiarity speeds development.
- **Trade-off:** Firebase has better offline sync and more mature push notification infrastructure. Mitigated by Expo's notification system.

### ADR-003: RevenueCat for payments
- **Decision:** Use RevenueCat to manage subscriptions
- **Rationale:** IAP is notoriously complex (receipt validation, subscription states, cross-platform sync, grace periods). RevenueCat handles all edge cases. Worth the 1% fee at scale.
- **Revisit when:** Revenue exceeds $5M ARR and the 1% fee becomes material ($50K+/year)

### ADR-004: Manual verification (MVP) → Automated (Phase 2+)
- **Decision:** Start with admin-reviewed verification queue
- **Rationale:** Automated D9 verification requires relationships with national org databases (complex, political). Manual review is slower but ensures 100% accuracy. Admin dashboard + queue is simple to build.
- **Revisit when:** Queue exceeds 100 verifications/day (need automation or more reviewers)

### ADR-005: City-by-city rollout
- **Decision:** Soft launch in Atlanta only, then expand city-by-city
- **Rationale:** Dating apps have LOCAL network effects. 500 users in Atlanta beats 5,000 spread nationally. Ensures every user has matches available from day one.
- **Expansion trigger:** 500+ active users in a city before opening the next

---

## Security Considerations

### Data Protection
- All PII encrypted at rest (Supabase handles this via PostgreSQL encryption)
- Messages encrypted in transit (TLS) and at rest
- Phone numbers and emails stored hashed/encrypted
- Photos served via authenticated URLs (no public links)
- Row Level Security ensures users only see their own data

### Authentication
- Phone number verification (OTP via Supabase Auth)
- Session tokens with refresh rotation
- Biometric unlock (FaceID/TouchID) for app access
- Account lockout after failed attempts

### Content Moderation
- Photo NSFW detection (automated, Phase 2)
- Text content filtering
- Report system with admin review queue
- Automated ban for repeat offenders

### Privacy
- Location stored as city-level, not exact coordinates (for discovery)
- Exact coordinates used only for distance calculation, never exposed
- Profile visibility controls (pause, hide)
- Data deletion on account removal (GDPR/CCPA compliant)
- No screenshot detection at MVP (consider Phase 2, like Raya)

---

## Infrastructure Costs (Estimated)

### Year 1 (MVP, <50K users)

| Service | Monthly Cost | Notes |
|---|---|---|
| Supabase Pro | $25 | 8GB database, 250GB bandwidth |
| Supabase Storage | $25-50 | Photo storage (grows with users) |
| Apple Developer | $8.25 | $99/year |
| Google Play Developer | $2.08 | $25 one-time |
| Expo/EAS | $0-99 | Free tier sufficient for MVP |
| RevenueCat | $0 | Free under $2.5K MTR |
| Sentry | $0-26 | Free tier or Team plan |
| Mixpanel | $0 | Free under 20M events |
| Domain + Email | $15 | Custom domain |
| **Total** | **~$100-250/month** | |

### Year 2 (Growth, 50K-225K users)

| Service | Monthly Cost |
|---|---|
| Supabase Pro (scaled) | $75-200 |
| Supabase Storage | $100-300 |
| EAS Build (Production) | $99 |
| RevenueCat | ~$300-500 (1% of revenue) |
| Sentry Business | $80 |
| Mixpanel Growth | $0-500 |
| **Total** | **~$700-1,600/month** |

---

## Development Workflow

### Multi-Device Development (Critical Requirement)
1. All code on GitHub (source of truth)
2. EAS Build for cloud builds (no local Xcode needed)
3. Expo Go for development testing on physical devices
4. Environment variables managed via EAS Secrets (not in repo)
5. Branch-based development (main = production, develop = staging)

### CI/CD Pipeline
```
Push to GitHub
    → GitHub Actions: lint + type-check + test
    → On merge to develop: EAS Build (preview)
    → On merge to main: EAS Build (production) + EAS Submit
```

### Branch Strategy
- `main` — production (auto-deploys via EAS)
- `develop` — staging/preview builds
- `feature/*` — feature branches
- `fix/*` — bug fixes
