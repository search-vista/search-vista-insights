import { createClient } from '@supabase/supabase-js'

export type Site = {
  id: string
  name: string
  url: string
  status: number
  created_at: string
}

export type ScoreRun = {
  id: string
  site_id: string
  performance: number | null
  accessibility: number | null
  best_practices: number | null
  seo: number | null
  lcp: number | null
  cls: number | null
  inp: number | null
  error: string | null
  checked_at: string
}

// Server-only client using service role key — never import from client components.
// Lazy singleton: created on first call, not at module load time.
let _client: ReturnType<typeof createClient> | undefined

export function getSupabase() {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Missing Supabase environment variables')
    _client = createClient(url, key)
  }
  return _client
}

