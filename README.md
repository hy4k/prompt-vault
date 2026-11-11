# PromptVault

A full-stack, mobile-responsive platform to **save, organize, copy, and discover professional AI prompts** — categorized by industry, with a community feed, likes, and a creator follow system.

- **Frontend:** React 18 + Vite, Tailwind CSS, Lucide icons — glassmorphism UI on an obsidian background (`#07070B`) with golden-yellow accents (`#FFD633` / `#F4DE6B`)
- **Backend:** Node.js + Express (custom logic / stats endpoints)
- **Data & Auth:** Supabase (PostgreSQL) — email/password auth, RLS-protected tables

## Project structure

```
promptvault/
├── supabase/
│   ├── schema.sql          # Tables, triggers, views, RPCs, RLS policies
│   └── seed.sql            # Optional demo creators + prompts (password: password123)
├── web/                    # React + Vite frontend (talks to Supabase directly)
│   ├── src/
│   │   ├── components/     # Navbar, PromptCard, PromptModal, CategoryFilter, …
│   │   ├── context/        # AuthContext, ToastContext
│   │   ├── hooks/          # usePromptActions (copy / like / follow)
│   │   ├── lib/            # supabase client, constants, clipboard helper
│   │   └── pages/          # Feed, Vault, Profile, Login, Signup
│   └── .env.example
└── server/                 # Express API (optional custom backend logic)
    ├── index.js            # /api/health, /api/stats
    └── .env.example
```

## 1. Supabase setup (5 minutes)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor → New query**, paste the full contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. It creates:
   - `profiles` (auto-created on signup via trigger), `prompts`, `likes`, `follows`
   - `prompt_details` view (prompts + author + like count) powering the feed
   - Row Level Security: public prompts are readable by anyone; users can only edit their own data
3. **Authentication → Providers**: enable **Email** (password min length 6 recommended).
4. **Project Settings → API**: copy the **Project URL** and **anon public key**.
5. *(Optional)* Run [`supabase/seed.sql`](supabase/seed.sql) in the SQL Editor to load 4 demo creators (`mia@` / `kate@` / `dev@` / `sam@promptvault.app`, password `password123`) and 8 public prompts with likes — the feed is alive immediately.

## 2. Web app

```bash
cd web
cp .env.example .env        # Windows: copy .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm install
npm run dev                 # http://localhost:5173
```

## 3. API server (optional)

The frontend works without it (it calls Supabase directly). Run it for custom endpoints:

```bash
cd server
cp .env.example .env        # optional; only needed for /api/stats
npm install
npm run dev                 # http://localhost:4000
```

- `GET /api/health` — liveness check
- `GET /api/stats` — platform totals (requires `SUPABASE_SERVICE_ROLE_KEY` in `server/.env`)

During development Vite proxies `/api/*` to the server (see `web/vite.config.js`).

## Features (Phase 1)

| Feature | Where |
|---|---|
| Email/password auth, profiles (avatar, bio, counts) | `context/AuthContext.jsx`, `pages/LoginPage.jsx`, `pages/SignupPage.jsx` |
| Community feed: trending (likes) / newest, category filter, search | `pages/FeedPage.jsx`, `components/CategoryFilter.jsx` |
| One-tap copy + toast + copy counter | `hooks/usePromptActions.js`, `context/ToastContext.jsx` |
| Personal vault: create / edit / tag / delete / public toggle | `pages/VaultPage.jsx`, `components/PromptModal.jsx` |
| Follow / unfollow creators, follower lists | `pages/ProfilePage.jsx`, `hooks/usePromptActions.js` |

## Categories

Coding · Copywriting · Marketing · Productivity · Art/Midjourney · Other

## Mobile app (Capacitor)

The Android project lives in `web/android/` — a full Capacitor wrapper around the same React app.

**Prereqs:** Android Studio + Android SDK. (iOS requires a Mac: `npx cap add ios` there.)

```bash
cd web

# Rebuild the mobile bundle (bakes the production API origin into the app)
VITE_API_URL=https://orchestrio.in npm run build

# Push web + plugin changes into the native project
npx cap sync android
```

Then in Android Studio: **Open** → `web/android/` → Run on a device, or
**Build → Generate Signed App Bundle** for the Play Store.

- App ID: `in.orchestrio.promptvault`
- Icons & splash screens are generated from `web/resources-src/` via
  `npx @capacitor/assets generate`
- The web deploy is unaffected — it uses same-origin `/api` (no `VITE_API_URL`)
- Store subscriptions: when you're ready for in-app purchases, integrate
  **RevenueCat** — its webhook can flip `profiles.plan` exactly like the
  Stripe webhook does today.

## Notes

- Private prompts are invisible to everyone (including the feed) thanks to RLS — the client never filters them out itself.
- `follower_count` / `following_count` are maintained by database triggers, so counts stay correct even with concurrent follows.
- The schema file is idempotent — safe to re-run.

## Local mock billing (UI testing only)

Set `VITE_LOCAL_MOCK_BILLING=true` in `web/.env` and run `npm run dev` from `web`. Restart Vite after changing the flag. Open http://localhost:5173/pricing and sign in normally. No API server or payment-provider account is required for this simulation.

1. Click **Set mock Free** to start from Free.
2. Select Monthly or Yearly, then **Simulate upgrade to Pro**. The navbar Go Pro CTA disappears and the plan-limit UI uses Pro.
3. Click **Manage mock billing**, then **Cancel at period end**. Pro stays enabled and a cancellation notice appears.
4. Use **Resume mock subscription** to undo the cancellation, or **Simulate period end → Free** to end access and restore the Free UI.
5. **Reset mock** restores the actual stored profile. Reloading or signing out clears the simulation; state is memory-only and scoped to the signed-in user.

Safety: Vite's config enables this code only for its development server in development mode with the explicit flag. Every build defines the gate as false (including builds with the flag set or NODE_ENV=development), allowing mock modules and controls to be removed from the bundle. Runtime checks additionally require localhost/127.0.0.1/[::1]. No server mock routes exist; no Stripe requests, subscription writes, profile updates, or auth bypasses are added. Production must be deployed with `npm run build`, not a Vite development server.

This tests UI state, not payments, signed webhooks, or database entitlements. Supabase RLS stays enforced: a mock Pro user whose actual plan is Free still cannot exceed the database's free prompt limit. Avoid testing destructive prompt operations against real data.

Tests: from `web`, run `node --test src/lib/mockBillingState.test.js src/lib/mockBillingGate.test.js` and `npm run build`.
