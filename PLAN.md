# Plan: PageSpeed Insights Dashboard

## Stack
- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** Supabase (Postgres) — scores storage + RLS
- **Infrastructure:** Vercel — hosting + Cron Jobs
- **Auth:** Auth.js v5 (NextAuth) — Google OAuth, domain restricted to `@searchvista.co.uk`
- **UI:** TanStack Table v8, Tailwind CSS, Lucide Icons
- **Utility:** Zod (validation), p-limit (concurrency), Recharts (trends)
- **Alerting:** Slack Incoming Webhooks

## Decisions & Constraints
- **Device:** Mobile only (PSI Strategy)
- **Schedule:** Weekly (Monday 8am UTC)
- **Capacity:** 20–100 sites
- **Performance:** Handle Vercel function timeouts via sequential/pooled processing.

---

## Database Schema

### `sites`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| name | text | Display name |
| url | text | Unique index |
| created_at | timestamptz | |

### `score_runs`
| Column | Type | Notes |
|---|---|---|
| id | uuid (PK) | |
| site_id | uuid (FK) | Index: `(site_id, checked_at DESC)` |
| performance | smallint | 0–100 |
| accessibility | smallint | 0–100 |
| best_practices | smallint | 0–100 |
| seo | smallint | 0–100 |
| lcp | numeric | Largest Contentful Paint (seconds) |
| cls | numeric | Cumulative Layout Shift |
| inp | numeric | Interaction to Next Paint (ms) |
| error | text | Store PSI API error messages if run fails |
| checked_at | timestamptz | Default `now()` |

---

## Project Structure

```
src/
  app/
    (auth)/login/page.tsx
    (dashboard)/
      page.tsx
      site/[id]/page.tsx      # Phase 4: History
    api/
      auth/[...nextauth]/route.ts
      cron/collect/route.ts
  components/
    ScoreBadge.tsx
    SitesTable.tsx
    TrendSparkline.tsx        # Mini charts for scores
  lib/
    psi.ts                    # Zod-validated PSI client
    supabase.ts
    validations.ts            # Shared Zod schemas (env, API)
  middleware.ts
vercel.json
```

---

## Phases & Steps

### Phase 1 — Foundation & Security
1. **Init:** Next.js 15 project (TypeScript, Tailwind, `src/`).
2. **Database:** Supabase migrations + **RLS Policies** (authenticated users can read, service role can write).
3. **Auth:** Auth.js v5 Google Provider with `hd` restriction and `signIn` callback validation.
4. **Middleware:** Protect `/` and `/site/*`, bypass `/login` and `/api/cron/*`.
5. **Validation:** Setup `lib/validations.ts` for `process.env` checking.

### Phase 2 — Data Pipeline (The "Engine")
6. **PSI Client:** Create `lib/psi.ts` using `zod` to parse the Google API response. Include Core Web Vitals (LCP, CLS, INP).
7. **Collection API:** `app/api/cron/collect/route.ts`
    - Validate `CRON_SECRET`.
    - Use `p-limit` to process sites with a concurrency of 3 (prevents 429s).
    - Implement a "soft timeout" check: if the function is near the Vercel limit (e.g., 55s), stop processing and log remaining sites to ensure it doesn't hard-crash.
8. **Cron:** Set `vercel.json` to `"0 8 * * 1"`.

### Phase 3 — Dashboard UI
9. **Data Fetching:** Server Component queries `sites` and joins the two most recent `score_runs` per site.
10. **Table:** TanStack Table v8 with:
    - **Site:** Clickable link to PSI + internal link to `/site/[id]`.
    - **Scores:** `ScoreBadge` with color-coding + delta indicator.
    - **Vitals:** Display LCP, CLS, and INP metrics.
    - **Trends:** Phase 4 addition (Sparkline).

### Phase 4 — Analytics & History
12. **Site Detail:** `/site/[id]` page showing a line chart of all 4 category scores over time using Recharts.
13. **Slack Alerting:** If `performance` drops > 10 points vs previous run, send a formatted Slack message.

---

## Environment Variables
| Variable | Purpose |
|---|---|
| `AUTH_SECRET` | Auth.js signing (v5) |
| `AUTH_GOOGLE_ID` | Google OAuth |
| `AUTH_GOOGLE_SECRET` | Google OAuth |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only DB |
| `PSI_API_KEY` | Google PSI API |
| `CRON_SECRET` | Secure endpoint |
| `SLACK_WEBHOOK_URL` | Alerting |

---

## Verification & Testing
1. **Unit:** Test `lib/psi.ts` with mocked "Perfect", "Failing", and "Partial" API responses.
2. **Integration:** Trigger `/api/cron/collect` locally with 5 sites to verify DB insertion and concurrency.
3. **Performance:** Ensure the dashboard query uses the `(site_id, checked_at)` index (EXPLAIN ANALYZE in Supabase).

## Post-MVP Enhancements
- **Manual Trigger:** "Run Audit" button for admins — needs a separate authenticated API route to proxy the cron call (avoids exposing `CRON_SECRET` client-side).
- **E2E Tests:** Playwright tests for the login flow and table sorting.
- **Vercel Pro:** At ~100 sites with `p-limit(3)` and ~2s per PSI call, runtime approaches ~67s — exceeds the 60s Hobby tier limit. Upgrade to Pro if site count grows beyond ~80.
- **Site status column:** Add `status smallint NOT NULL DEFAULT 1` to the `sites` table. Inactive sites (status = 0) are excluded from cron collection. Steps: (1) `ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS status smallint NOT NULL DEFAULT 1` in Supabase SQL Editor; (2) add `status: number` to `Site` type in `src/lib/supabase.ts`; (3) add optional `status?: number` to `SiteEntry` in `src/data/sites.ts`; (4) include `status` in seed script upsert; (5) add `.eq('status', 1)` to the sites fetch query in `src/app/api/cron/collect/route.ts`. Consider showing inactive sites in the dashboard with a grey "Inactive" badge rather than hiding them entirely.
