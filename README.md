# Search Vista Insights

An internal PageSpeed Insights dashboard that tracks Google Lighthouse scores and Core Web Vitals across all managed client sites. Scores are collected automatically each week and displayed in a sortable table with trend history and Slack alerting for performance regressions.

## Overview

| | |
|---|---|
| **Framework** | Next.js 16 (App Router, TypeScript) |
| **Database** | Supabase (Postgres) |
| **Hosting / Cron** | Vercel |
| **Auth** | Auth.js v5 — Google OAuth, restricted to `@searchvista.co.uk` |
| **UI** | TanStack Table v8, Tailwind CSS v4, Recharts, Lucide Icons |
| **Score source** | Google PageSpeed Insights API (mobile strategy) |
| **Collection schedule** | Every Monday at 08:00 UTC |
| **Alerting** | Slack Incoming Webhook (optional) |

### What gets tracked

Each weekly run records four Lighthouse category scores (Performance, Accessibility, Best Practices, SEO) plus three Core Web Vitals (LCP, CLS, INP) for every site in the database. The dashboard shows the latest scores alongside a delta vs the previous run, and a per-site history page with line charts.

---

## Initial Setup

### 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google Cloud](https://console.cloud.google.com) project with the **PageSpeed Insights API** and **Google OAuth** enabled
- A Vercel account (for deployment and scheduled cron jobs)

### 2. Clone and install dependencies

```bash
git clone <repo-url>
cd search-vista-insights
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
# Auth.js
AUTH_SECRET=<generate with: npx auth secret>
AUTH_GOOGLE_ID=<your Google OAuth client ID>
AUTH_GOOGLE_SECRET=<your Google OAuth client secret>

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your service role key>

# Google PageSpeed Insights API
PSI_API_KEY=<your PSI API key>

# Cron authentication (any strong random string)
CRON_SECRET=<strong random string>

# Optional: Slack alerting
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` is a privileged key — never expose it client-side. It is only used server-side in the cron route and the seed script.

**Generating `AUTH_SECRET`:**
```bash
npx auth secret
```

### 4. Run the database migration

Open the **SQL Editor** in your Supabase dashboard and run the contents of `supabase/migration.sql`. This creates the `sites` and `score_runs` tables, indexes, RLS policies, and service-role grants.

### 5. Seed the database

Add your sites to `src/data/sites.ts` (see [Adding Sites](#adding-sites) below), then run:

```bash
npx tsx scripts/seed.ts
```

### 6. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You will be redirected to `/login` and prompted to sign in with a `@searchvista.co.uk` Google account.

---

## Deployment (Vercel)

1. Push the repository to GitHub and import it into Vercel.
2. Add all environment variables from `.env.local` to the Vercel project settings (Settings → Environment Variables).
3. Deploy. Vercel will automatically pick up `vercel.json` and schedule the cron job for every Monday at 08:00 UTC.

> **Cron authentication:** Vercel sends `Authorization: Bearer <CRON_SECRET>` with each scheduled request. The same secret can be used to trigger a manual run via `curl`:
> ```bash
> curl -X POST https://<your-domain>/api/cron/collect \
>   -H "x-cron-secret: <CRON_SECRET>"
> ```

---

## Regular Usage

### Adding sites

1. Open `src/data/sites.ts` and add an entry to the `sites` array:

   ```ts
   { name: 'My Client', url: 'https://example.com' },
   ```

2. Run the seed script to upsert the new entry into Supabase:

   ```bash
   npx tsx scripts/seed.ts
   ```

   The script uses an `upsert` on the `url` column, so existing sites are not duplicated and their historical data is preserved.

3. The new site will be included in the next scheduled collection run. To check it immediately, trigger the cron endpoint manually (see above).

### Removing sites

Delete the entry from `src/data/sites.ts`, then remove the row directly from the Supabase dashboard (Table Editor → `sites`). All associated `score_runs` rows are deleted automatically via the `ON DELETE CASCADE` constraint.

> There is intentionally no automated removal in the seed script to prevent accidental data loss.

### Triggering a manual collection run

```bash
curl -X POST https://<your-domain>/api/cron/collect \
  -H "x-cron-secret: <CRON_SECRET>"
```

---

## Project Structure

```
src/
  app/
    (auth)/login/         # Google OAuth sign-in page
    (dashboard)/
      page.tsx            # Main sites table (server component)
      site/[id]/page.tsx  # Per-site score history
    api/
      auth/[...nextauth]/ # Auth.js route handler
      cron/collect/       # Score collection endpoint (cron + manual)
  components/
    ScoreBadge.tsx        # Colour-coded score pill with delta
    ScoreHistoryChart.tsx # Recharts line chart for history page
    SitesTable.tsx        # TanStack Table client component
  data/
    sites.ts              # Source of truth for tracked sites
  lib/
    env.ts                # Zod-validated environment variables
    psi.ts                # PageSpeed Insights API client
    supabase.ts           # Supabase client (service role)
  auth.ts                 # Auth.js config (Google provider, domain restriction)
scripts/
  seed.ts                 # Upserts src/data/sites.ts into Supabase
supabase/
  migration.sql           # Database schema (run once in Supabase SQL Editor)
vercel.json               # Cron schedule definition
```

---

## Slack Alerting

If `SLACK_WEBHOOK_URL` is set, the cron job will post a message to Slack whenever a site's Performance score drops by more than 10 points compared to its previous run. No configuration is required beyond setting the environment variable.

---

## Database Schema

### `sites`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `name` | text | Display name |
| `url` | text | Unique — used as upsert key |
| `created_at` | timestamptz | Set automatically |

### `score_runs`
| Column | Type | Notes |
|---|---|---|
| `id` | uuid | Primary key |
| `site_id` | uuid | FK → `sites.id` (cascade delete) |
| `performance` | smallint | 0–100 |
| `accessibility` | smallint | 0–100 |
| `best_practices` | smallint | 0–100 |
| `seo` | smallint | 0–100 |
| `lcp` | numeric | Largest Contentful Paint (seconds) |
| `cls` | numeric | Cumulative Layout Shift |
| `inp` | numeric | Interaction to Next Paint (ms) |
| `error` | text | PSI error message, if the run failed |
| `checked_at` | timestamptz | Set automatically |
