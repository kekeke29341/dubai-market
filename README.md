# Dubai Market 🏙️

A Mercari-style marketplace app for buying and selling items in Dubai, built with Next.js 14 + Supabase + Vercel.

## Features

- **Browse & Search** — Grid listing with category filter, price range, condition filter, and keyword search
- **Item Listings** — Photo upload (up to 8 images), title, description, price (AED), condition, category
- **Item Detail** — Full photo gallery, related items, seller profile, favorites, sharing
- **Real-time Messaging** — Buyer-seller chat powered by Supabase Realtime
- **Favorites (❤️)** — Save items you like
- **User Profiles** — Public profile with listings, ratings, and reviews count
- **My Page** — Manage your listings, sold items, and favorites
- **Authentication** — Email/password sign-up & login via Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deploy**: Vercel

---

## Setup Guide

### 1. Clone & Install

```bash
cd dubai-market
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Go to **SQL Editor** in your Supabase dashboard.
3. Copy the contents of `supabase/schema.sql` and run it.
4. Go to **Project Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploy to Vercel

### Option A — Vercel Dashboard (Recommended)

1. Push your project to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.
3. Add the three environment variables from `.env.local`.
4. Click **Deploy**.

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts and add environment variables when asked.

---

## iOS App (App Store)

Native iOS shell lives in [`mobile/`](./mobile/). It wraps the production site with Expo + EAS.

See **[mobile/APP_STORE.md](./mobile/APP_STORE.md)** for Apple Developer setup, EAS Build, and App Store Connect submission steps.  
Listing copy: **[mobile/STORE_LISTING.md](./mobile/STORE_LISTING.md)**.

```bash
cd mobile
npm install
npm start                 # Expo Go / simulator
npm run build:ios:preview # internal device build (screenshots)
npm run build:ios         # App Store production build
npm run submit:ios        # upload to App Store Connect
```

---

## Admin Panel

The admin panel is available at `/admin`. Access requires `is_admin = true` on the user's profile.

### How to grant admin access

After creating your account, run this in the Supabase SQL Editor:

```sql
update public.profiles
set is_admin = true
where username = 'your_username';
```

### Admin features

- **Dashboard** — live stats: users, listings, messages, flagged items, pending reports, banned accounts, security score
- **Items management** — filter by status/flagged, keyword search, pagination; flag items, add internal notes, delete, restore
- **Users management** — filter by admin/banned, search; grant/revoke admin, ban with reason, unban
- **Reports** — review user-submitted listing reports
- **Security** — automated security checks, prohibited-word list, and admin audit log (`/admin/security`)

Access the panel at `https://your-site.vercel.app/admin`. Non-admin users are redirected to the homepage.

### Security hardening SQL

After `schema.sql` and `admin_patch.sql`, run `supabase/security_hardening_migration.sql` in the Supabase SQL Editor. It:

- Blocks users from granting themselves `is_admin` or clearing a ban
- Prevents sellers from overwriting `is_flagged` / `admin_note`
- Stops banned accounts from creating listings or sending messages
- Adds `admin_audit_logs` and `security_check_status()` for the Security page

---

## Project Structure

```
src/
  app/                   # Next.js App Router pages
    page.tsx             # Home / browse
    items/[id]/          # Item detail + edit
    items/new/           # List new item (also /sell)
    messages/            # Inbox + chat
    mypage/              # My listings, sold, favorites
    profile/[id]/        # Public seller profile
    auth/                # Login, signup
    admin/               # Admin panel (dashboard, items, users, reports, security)
  components/
    layout/              # Header, Footer, tabs
    items/               # ItemCard, ItemForm, CategoryBar, FilterBar
    messages/            # ChatWindow
    admin/               # AdminItemActions, AdminUserActions, SecurityCheckList
    ui/                  # Button, Input, Badge
  lib/
    supabase/            # Client, server, admin, middleware helpers
    utils.ts             # Formatting helpers
  types/                 # TypeScript types
supabase/
  schema.sql             # Full database schema + RLS + triggers
  admin_patch.sql        # Admin columns + policies (run after schema.sql)
  security_hardening_migration.sql  # Privilege guards, ban blocks, audit log
```

---

## Customisation Tips

- **Currency**: Currently defaults to AED. Change `currency: 'AED'` in `ItemForm.tsx` and the schema default.
- **Categories**: Edit the `INSERT` statements in `schema.sql` to add/remove categories.
- **Locations**: Pre-fill dropdown with Dubai areas (Marina, JBR, Downtown, etc.) in `ItemForm.tsx`.
- **Payment**: Stripe or Tap Payments can be integrated into the item detail page when ready.
