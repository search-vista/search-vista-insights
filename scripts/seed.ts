/**
 * Seed script: populates the `sites` table from src/data/sites.ts
 * Run with: npx tsx scripts/seed.ts
 *
 * Requires .env.local to be present (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'
import { sites } from '../src/data/sites'

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') })

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(url, key)

async function seed() {
  console.log(`Seeding ${sites.length} site(s)...`)

  const { data, error } = await supabase
    .from('sites')
    .upsert(sites, { onConflict: 'url' })
    .select()

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  console.log(`Done. ${data?.length ?? 0} site(s) upserted.`)
  data?.forEach((s) => console.log(`  ✓ ${s.name} — ${s.url}`))
}

seed()
