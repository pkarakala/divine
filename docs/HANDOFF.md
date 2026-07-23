# Divine App — Designer Handoff Guide

This document walks you through setting up the Divine app on your Mac with Xcode so you can run it on the iOS Simulator and design/tweak the UI. No prior coding experience needed — just follow the steps in order.

---

## What You're Working With

Divine is a dating app for verified Divine 9 (Black Greek) members. It's built with:
- **React Native / Expo** — cross-platform framework (one codebase for iOS + Android)
- **TypeScript** — the programming language
- **Supabase** — cloud backend (database, auth, storage)

You'll be editing files in the `app/` and `components/` folders to change how screens look.

---

## Prerequisites

You need three things installed:

### 1. Xcode (from the Mac App Store)

1. Open the **App Store** on your Mac
2. Search for **Xcode**
3. Click **Get** / **Install** (it's ~12 GB, may take a while)
4. Once installed, open Xcode once and accept the license agreement
5. Go to **Xcode > Settings > Platforms** and make sure **iOS 17** (or latest) simulator is downloaded

### 2. Node.js (v20+)

The easiest way:
```bash
# Install Homebrew first (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install Node
brew install node
```

Verify it worked:
```bash
node --version   # Should show v20.x or higher
npm --version    # Should show 10.x or higher
```

### 3. Git

Git usually comes with Xcode, but verify:
```bash
git --version
```

---

## Getting the Code

```bash
# Clone the repo
git clone https://github.com/pkarakala/divine.git

# Go into the project folder
cd divine

# Install all dependencies
npm install
```

---

## Environment Setup

Create a file called `.env` in the project root:

```bash
# From inside the divine/ folder:
cat > .env << 'EOF'
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://mzjqoqyrhyseciyhaygi.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16anFvcXlyaHlzZWNpeWhheWdpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2ODQzODksImV4cCI6MjEwMDI2MDM4OX0.IcYzrpfs2hA--FkHKqDh92ENU-xLoi2MwgKhZF5L3wM
EOF
```

---

## Running the App

```bash
# Start the development server
npx expo start --ios
```

This will:
1. Start the Expo dev server
2. Open the iOS Simulator automatically
3. Build and launch the Divine app

**First run takes a few minutes.** After that it's fast.

### If the simulator doesn't open automatically:

```bash
# Press 'i' in the terminal where expo is running
# Or run this separately:
npx expo run:ios
```

---

## Demo Account Login

Demo credentials are **not** committed to the repo (they were once — audit
finding H-4 — and that password has been rotated). To enable the demo login,
add these to your local `.env` (ask the owner for the current values):

```
EXPO_PUBLIC_DEMO_EMAIL=...
EXPO_PUBLIC_DEMO_PASSWORD=...
```

With those set, the login screen shows a **"Try Demo Account"** button that
auto-fills and logs you in. Without them, the button is hidden — sign up with
your own test account instead.

Once logged in, you'll see the discovery screen with real mock profiles (Maya, Jasmine, Zara) that you can swipe through, like, and interact with.

---

## Project Structure (What to Edit)

```
divine/
├── app/                  # SCREENS — each file = one screen
│   ├── auth/             #   Login, signup, welcome screens
│   ├── onboarding/       #   New user setup flow
│   ├── (tabs)/           #   Main app tabs (discover, matches, events, profile)
│   └── _layout.tsx       #   Root navigation layout
├── components/           # REUSABLE UI PIECES
│   └── ui/               #   Buttons, inputs, cards, etc.
├── constants/
│   └── Theme.ts          # COLORS, SPACING, FONTS — change the look here
├── assets/               # Images, icons, fonts
└── docs/                 # Documentation
```

### Quick reference:
- **Change colors/fonts:** Edit `constants/Theme.ts`
- **Change a screen's layout:** Edit the file in `app/` (e.g., `app/(tabs)/discover.tsx`)
- **Change a reusable component:** Edit files in `components/ui/`

---

## Using Claude to Help

You have Claude — it can help you with any code changes. Here are useful prompts:

- "Change the primary color to [X] and show me what it looks like"
- "Make the discovery cards taller with rounded corners"
- "Redesign the login screen to look more like [describe what you want]"
- "Move the like button to [position] and make it [size]"
- "What does this file do?" (paste any code you don't understand)

Claude can read the project files and make edits for you. Just describe what you want visually and it'll write the code.

---

## Hot Reloading

When you save a file, the app in the simulator **updates automatically** (within 1-2 seconds). You don't need to restart anything — just save and look at the simulator.

If something breaks badly:
```bash
# Stop the server (Ctrl+C in terminal), then:
npx expo start --ios --clear
```

---

## Useful Commands

| Command | What it does |
|---------|-------------|
| `npx expo start --ios` | Start app in iOS Simulator |
| `npx expo start --web` | Start app in your browser (quick preview) |
| `npx expo start --clear` | Start fresh (clears cache) |
| `Ctrl+C` | Stop the dev server |
| `npm install` | Re-install dependencies (if something breaks) |

---

## Brand Guidelines

Keep these in mind while designing:

- **Primary:** Deep navy `#0D0D14` — sophistication
- **Accent:** Soft pink `#E4B8D5` — warmth
- **Gold touches:** `#C9A96E` — Greek prestige
- **Tone:** Warm, confident, culturally aware, never corporate
- **Women-first:** Every UX decision should prioritize women's safety and comfort
- **Less is more:** Limited interactions force intentionality

---

## Mock Users in the App

These profiles are live in the backend and will show up in discovery:

| Name | Org | Job | Gender |
|------|-----|-----|--------|
| Maya | Alpha Kappa Alpha | Marketing Director, Coca-Cola | F |
| Jasmine | Delta Sigma Theta | Software Engineer, Google | F |
| Zara | Zeta Phi Beta | Attorney, King & Spalding | F |
| Marcus | Alpha Phi Alpha | Investment Banker, Goldman Sachs | M |
| Darius | Kappa Alpha Psi | Physician, Emory Healthcare | M |
| Jordan | Omega Psi Phi | Product Manager, Microsoft | M |

The demo account (Alex) is male and looking for female, so you'll see Maya, Jasmine, and Zara in the feed.

---

## Troubleshooting

**"Command not found: npx"**
→ Node isn't installed or your terminal needs to be restarted. Close and reopen Terminal.

**Simulator shows a white/blank screen**
→ Wait 10-15 seconds. First load is slow. If it persists, shake the device (Cmd+Ctrl+Z) and tap "Reload".

**"Unable to resolve module" error**
→ Run `npm install` again, then restart with `npx expo start --ios --clear`.

**Login says "Invalid credentials"**
→ Make sure you're using email mode (tap "Email" toggle) and that `EXPO_PUBLIC_DEMO_EMAIL`/`EXPO_PUBLIC_DEMO_PASSWORD` in your `.env` are current.

**Xcode simulator not showing up**
→ Open Xcode > Settings > Platforms > download iOS simulator runtime.

---

## Questions?

Ask Claude — it has full context on this project. Just reference this doc or the codebase and it'll help you make any design changes.
