-- Run this in the Supabase SQL Editor

-- Sites table
create table if not exists public.sites (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  url        text not null unique,
  created_at timestamptz not null default now()
);

-- Score runs table
create table if not exists public.score_runs (
  id            uuid primary key default gen_random_uuid(),
  site_id       uuid not null references public.sites(id) on delete cascade,
  performance   smallint,
  accessibility smallint,
  best_practices smallint,
  seo           smallint,
  lcp           numeric,
  cls           numeric,
  inp           numeric,
  error         text,
  checked_at    timestamptz not null default now()
);

-- Index for fast latest-run lookups per site
create index if not exists score_runs_site_checked
  on public.score_runs (site_id, checked_at desc);

-- RLS: enable row-level security
alter table public.sites enable row level security;
alter table public.score_runs enable row level security;

-- Authenticated users can read all rows
create policy "Authenticated users can read sites"
  on public.sites for select
  to authenticated
  using (true);

create policy "Authenticated users can read score_runs"
  on public.score_runs for select
  to authenticated
  using (true);

-- Explicit grants for service_role (required for INSERT/UPDATE/DELETE via the API)
grant all on public.sites to service_role;
grant all on public.score_runs to service_role;
