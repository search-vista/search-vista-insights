import { getSupabase, type Site, type ScoreRun } from '@/lib/supabase'
import { SitesTable, type SiteRow } from '@/components/SitesTable'
import { auth } from '@/auth'

async function getDashboardData(): Promise<SiteRow[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('sites')
    .select('id, name, url, status')
    .order('name')
  const sites = data as Pick<Site, 'id' | 'name' | 'url' | 'status'>[] | null

  if (error || !sites) return []

  // For each site, fetch the two most recent score runs
  const rows = await Promise.all(
    sites.map(async (site) => {
      const { data: runsData } = await getSupabase()
        .from('score_runs')
        .select('performance, accessibility, best_practices, seo, lcp, cls, inp, error, checked_at')
        .eq('site_id', site.id)
        .order('checked_at', { ascending: false })
        .limit(2)
      const runs = runsData as Pick<ScoreRun, 'performance' | 'accessibility' | 'best_practices' | 'seo' | 'lcp' | 'cls' | 'inp' | 'error' | 'checked_at'>[] | null

      const latest = runs?.[0] ?? null
      const previous = runs?.[1] ?? null

      function delta(
        key: 'performance' | 'accessibility' | 'best_practices' | 'seo'
      ): number | null {
        if (!latest || !previous) return null
        const a = latest[key]
        const b = previous[key]
        if (a === null || b === null) return null
        return a - b
      }

      return {
        id: site.id,
        name: site.name,
        url: site.url,
        status: site.status,
        performance: latest?.performance ?? null,
        accessibility: latest?.accessibility ?? null,
        best_practices: latest?.best_practices ?? null,
        seo: latest?.seo ?? null,
        lcp: latest?.lcp ?? null,
        cls: latest?.cls ?? null,
        inp: latest?.inp ?? null,
        error: latest?.error ?? null,
        checked_at: latest?.checked_at ?? '',
        delta_performance: delta('performance'),
        delta_accessibility: delta('accessibility'),
        delta_best_practices: delta('best_practices'),
        delta_seo: delta('seo'),
      } satisfies SiteRow
    })
  )

  return rows
}

function formatLastRun(isoString: string): string {
  const date = new Date(isoString)
  const day = date.getDate()
  const ordinal = (d: number) => {
    if (d > 3 && d < 21) return 'th'
    switch (d % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }
  const weekday = date.toLocaleDateString('en-GB', { weekday: 'long' })
  const month = date.toLocaleDateString('en-GB', { month: 'long' })
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${weekday}, ${day}${ordinal(day)} ${month} ${year}, ${hours}:${minutes}`
}

export default async function DashboardPage() {
  const session = await auth()
  const data = await getDashboardData()

  const lastChecked = data
    .map((r) => r.checked_at)
    .filter(Boolean)
    .sort()
    .at(-1)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">PageSpeed Insights Dashboard</h1>
          {lastChecked && (
            <p className="text-xs text-gray-400 mt-0.5">
              Last run: {formatLastRun(lastChecked)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{session?.user?.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-screen-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {data.length} site{data.length !== 1 ? 's' : ''} tracked · scores updated weekly
          </p>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> 90–100
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" /> 50–89
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> 0–49
            </span>
          </div>
        </div>

        <SitesTable data={data} />
      </main>
    </div>
  )
}
