# Search Vista Insights: PageSpeed Dashboard

An automated PageSpeed Insights (PSI) monitoring dashboard built with Next.js 15 and Supabase. Designed for the Search Vista team to track performance, accessibility, and Core Web Vitals across 20-100 client sites.

## 🚀 Features

- **Automated Audits:** Weekly cron jobs (Mondays 8 AM UTC) trigger mobile audits for all tracked sites.
- **Performance Intelligence:** Tracks Lighthouse scores (Performance, Accessibility, Best Practices, SEO) + Core Web Vitals (LCP, CLS, INP).
- **Delta Tracking:** Compare the latest run against the previous week to see point fluctuations at a glance.
- **Secure Access:** Restricted to `@searchvista.co.uk` Google accounts via Auth.js v5.
- **Historical Analysis:** Drill-down views for each site showing score trends over time (Phase 4).
- **Slack Alerts:** Automatic notifications for significant performance drops (≥ 10 points).

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Database:** Supabase (PostgreSQL) with Row Level Security (RLS)
- **Authentication:** Auth.js v5 (NextAuth) with Google OAuth
- **Table Engine:** TanStack Table v8
- **Styling:** Tailwind CSS & Lucide Icons
- **Data Fetching:** PageSpeed Insights API (v5)
- **Monitoring:** Vercel Cron Jobs

## 🚦 Getting Started

### Prerequisites

- Node.js 20+
- A Supabase Project
- A Google Cloud Project (for OAuth and PSI API Key)

### Installation

1. **Clone and Install:**
   ```bash
   git clone https://github.com/search-vista/insights.git
   cd insights
   npm install
   ```

2. **Environment Setup:**
   Create a `.env.local` file with the following:
   ```env
   # Auth
   AUTH_SECRET= # Generate with: npx auth secret
   AUTH_GOOGLE_ID=
   AUTH_GOOGLE_SECRET=

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=

   # API
   PSI_API_KEY=
   CRON_SECRET= # Used to secure the collection endpoint
   SLACK_WEBHOOK_URL=
   ```

3. **Database Setup:**
   Run the SQL migrations found in `supabase/migrations` (or refer to `PLAN.md` for schema details).

4. **Development:**
   ```bash
   npm run dev
   ```

## 📅 Deployment

- **Hosting:** Deploy to Vercel.
- **Cron:** Ensure `vercel.json` is configured to trigger `api/cron/collect`.
- **Domain Restriction:** The application only allows sign-ins from the `searchvista.co.uk` hosted domain.
