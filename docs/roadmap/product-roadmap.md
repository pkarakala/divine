# Divine — Product Roadmap

## Vision
The exclusive dating app for the Divine 9 — where Greek love begins.

## Strategy
Launch like Tinder (chapter-by-chapter density), operate like Raya (exclusive membership community), engage like Hinge (intentional, prompt-based connections).

---

## Phase 0: Foundation (Weeks 1-4)
*Build the technical foundation and design system*

### Deliverables
- [ ] Expo/React Native project scaffolded with TypeScript
- [ ] Navigation structure (tab-based: Discover, Likes, Matches, Events, Profile)
- [ ] Design system established (colors, typography, components)
- [ ] Authentication flow (phone number + email)
- [ ] Backend infrastructure (Supabase or Firebase)
- [ ] CI/CD pipeline (EAS Build + GitHub Actions)

### Key Decisions
- Stack: Expo + React Native + TypeScript
- Backend: Supabase (PostgreSQL, Auth, Realtime, Storage)
- Build: EAS Build for cloud builds
- Design: Custom design system with D9 cultural aesthetics

---

## Phase 1: MVP (Months 1-3)
*Core dating functionality — enough to test product-market fit*

### Features
- [ ] **Onboarding & Verification**
  - Phone/email signup
  - D9 organization selection (which org, chapter, line name/number, year)
  - Manual verification queue (admin reviews membership claims)
  - Profile creation wizard
  
- [ ] **Profile System**
  - 6 photos maximum
  - 3 D9-specific prompts (e.g., "My chapter means...", "Probate night was...", "Greek life taught me...")
  - Basic info: age, location, occupation, education
  - Organization badge (verified)
  - Org preference filter (match within org, across all D9, no preference)

- [ ] **Discovery & Matching**
  - Card-based browsing (like Hinge — interact with specific content)
  - Like/Pass with required comment on a specific photo or prompt
  - Limited likes: 8/day free, unlimited for paid
  - Mutual match → conversation unlocked
  - Basic filters: age range, distance, organization

- [ ] **Messaging**
  - Text messaging between matches
  - Photo sharing
  - "Your Turn" indicators
  - Match expiration (7 days to message or match expires)

- [ ] **Core Infrastructure**
  - Push notifications (new likes, messages, matches)
  - Report/block functionality
  - Basic admin dashboard for verification queue

### Success Criteria (End of Phase 1)
- 1,000+ verified users in launch city (Atlanta)
- 50+ mutual matches per week
- 30-day retention > 20%
- Gender ratio within 40/60
- App Store rating ≥ 4.0

---

## Phase 2: Growth (Months 4-8)
*Expand features, cities, and monetization*

### Features
- [ ] **Enhanced Matching**
  - "Most Compatible" daily pick (Gale-Shapley algorithm)
  - Org-preference matching (prioritize cross-org pairings or same-org)
  - "We Met" feedback after giving out phone number (trains algorithm)
  - Standouts feed (curated exceptional profiles)
  
- [ ] **Monetization (Divine+ and Divine Elite)**
  - Subscription paywalls
  - "See Who Liked You" (paid feature)
  - Roses (super-likes) — a la carte
  - Profile boosts — a la carte
  - Apple/Google IAP integration

- [ ] **Events Module**
  - In-app event listings (chapter events, mixers, speed dating)
  - RSVP system
  - Post-event matching (match with people who attended same event)
  - Divine-hosted virtual events (video speed dating)

- [ ] **Trust & Safety**
  - Photo verification (selfie match)
  - Automated moderation (inappropriate content detection)
  - Enhanced reporting with categories
  - Community guidelines enforcement

- [ ] **Profile Enhancements**
  - Voice prompts (audio answers to prompts)
  - Video introductions (15-second clips)
  - Spotify integration (music taste)
  - Instagram link (optional)

### Expansion Plan
- Atlanta (launch) → Washington D.C. → Houston → Dallas → Chicago
- 5 cities by end of Phase 2
- City-by-city density strategy (don't go national until 500+ users/city)

### Success Criteria (End of Phase 2)
- 30,000+ total users across 5 cities
- 2,000+ paying subscribers
- MRR > $30K
- Free-to-paid conversion > 6%
- 100+ "We Met" confirmations

---

## Phase 3: Scale (Months 9-14)
*National expansion, advanced features, community*

### Features
- [ ] **Advanced Algorithm**
  - ML-based compatibility scoring using "We Met" data
  - Behavioral analysis (swipe patterns, messaging habits)
  - De-prioritize inactive users
  - Smart timing (send likes when recipient is active)

- [ ] **Community Features**
  - Chapter leaderboards (most active chapters)
  - Success stories showcase
  - "Greek Date Ideas" content feed
  - Anniversary celebrations (matched couples)

- [ ] **Premium Matchmaking (Divine Concierge)**
  - Human-assisted matching for $99-$299/month tier
  - Dedicated matchmaker reviews profile, provides coaching
  - Curated introductions (3-5 per month)
  - Date planning assistance

- [ ] **Event Platform Expansion**
  - Ticketed Divine-hosted events (mixers, galas, speed dating)
  - Partner with Boules/conventions for presence
  - Virtual events for long-distance connections
  - Group activities (double dates, friend groups)

- [ ] **Referral & Waitlist System**
  - Member referral codes (skip waitlist)
  - Referral rewards (free month of Divine+)
  - Waitlist for non-D9 members (future expansion)
  - Chapter ambassador program

### Expansion
- 25+ cities nationally
- International chapters (London, Toronto, military bases)
- Begin exploring adjacent markets (HBCU alumni who aren't D9)

### Success Criteria (End of Phase 3)
- 200,000+ total users
- 20,000+ paying subscribers
- ARR > $4M
- Active in 25+ markets
- Brand recognition within D9 community

---

## Phase 4: Mature (Month 15+)
*Platform expansion, diversification, potential exit*

### Features
- [ ] **Beyond Dating**
  - Networking mode (professional connections, mentorship)
  - Friend-finding mode (new to a city, find Greek community)
  - Roommate matching (young professionals)

- [ ] **Brand Partnerships**
  - Curated date experiences with restaurant/venue partners
  - D9 merchandise integration
  - Travel packages (Boule, homecoming travel)

- [ ] **Data & Insights**
  - Annual "State of D9 Dating" report (PR + community value)
  - Anonymized trend data for community insights
  - Academic research partnerships

### Strategic Options
1. Continue as profitable independent business ($15-30M ARR)
2. Raise Series A/B for aggressive expansion
3. Acquisition target (Match Group, Bumble Inc.)
4. Expand TAM to all HBCU alumni / Black professional networks

---

## Launch Strategy

### Pre-Launch (4 weeks before)
1. **Build the waitlist** — landing page with "Apply for Early Access"
2. **Chapter ambassadors** — recruit 2-3 D9 members per target org in launch city
3. **Social proof** — get Greek influencers/content creators to tease the app
4. **Event presence** — attend D9 events in Atlanta with branded presence

### Launch Week
1. **Women first** — open to sorority members 48 hours before fraternity members
2. **Chapter activation** — ambassadors share in chapter group chats
3. **Limited access** — first 500 members in each city (creates urgency)
4. **Launch event** — Divine-hosted mixer in Atlanta (app-only invites)

### Post-Launch (ongoing)
1. **Convention season** — presence at every major D9 event
2. **Homecoming circuit** — HBCU homecoming activations
3. **Success stories** — amplify every relationship that forms
4. **Chapter outreach** — systematic chapter-by-chapter recruitment
5. **Content marketing** — D9 dating culture content (Instagram, TikTok)

---

## Key Product Principles

1. **Women first** — every decision passes the test: "would a D9 woman feel safe and valued?"
2. **Quality over quantity** — limited interactions force intentionality
3. **Verification is trust** — the org badge is everything; never compromise verification integrity
4. **Community, not just dating** — Divine is where Greek love lives, not where you swipe
5. **Celebrate the culture** — prompts, events, and features should honor D9 traditions
6. **Design for deletion** — success means couples leave the app. That's the goal.
7. **Density before breadth** — 500 users in one city beats 5,000 spread across 50
