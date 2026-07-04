# The Rack

A powerlifting tracker: logging (sets, PRs, plate math), coaching insight
(strength standards, weak-point diagnosis, deload detection), and community
(leaderboards, gym grouping, PR feed).

Stack: Next.js (App Router) + Supabase (Postgres, Auth) + Vercel.

## Status

- [x] Database schema + Row-Level Security (`supabase/migrations/`)
- [x] Auth flow: email/password signup, login, logout
- [ ] Core logging UI
- [ ] Standards / weak-point diagnosis
- [ ] Leaderboard + gym grouping
- [ ] PR feed
- [ ] Coach view

## Local setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com) (free
   tier). Once created, grab these from Project Settings → API:
   - Project URL
   - `anon` public key

3. **Configure environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

4. **Run the database migrations** against your Supabase project. Either
   paste the contents of `supabase/migrations/0001_init_schema.sql` and
   `supabase/migrations/0002_rls_policies.sql` (in that order) into the
   Supabase SQL Editor, or, if you have the Supabase CLI linked to the
   project:

   ```bash
   supabase db push
   ```

5. **Auth email settings**: in the Supabase dashboard under
   Authentication → URL Configuration, set the Site URL to your local dev
   URL (`http://localhost:3000`) for now, and add it to the Redirect URLs
   allow list too. Update both to your real domain once deployed.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, sign up with an email/password, confirm
   via the email Supabase sends, then log in.

## Project structure

- `src/app/` — routes (Next.js App Router)
- `src/lib/supabase/` — Supabase client helpers (browser, server, middleware)
- `supabase/migrations/` — SQL schema and RLS policies, applied in order
