import { getSupabase, type Site, type ScoreRun } from '@/lib/supabase'
import { ScoreHistoryChart } from '@/components/ScoreHistoryChart'
import { ScoreBadge } from '@/components/ScoreBadge'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'

export default async function SiteDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = getSupabase()
  const { data: siteData } = await supabase
    .from('sites')
    .select('id, name, url')
    .eq('id', params.id)
    .single()
  const site = siteData as Pick<Site, 'id' | 'name' | 'url'> | null

  if (!site) notFound()

  const { data: runsData } = await supabase
    .from('score_runs')
    .select('performance, accessibility, best_practices, seo, lcp, cls, inp, checked_at')
    .eq('site_id', site.id)
    .order('checked_at', { ascending: true })
    .limit(52) // up to 1 year of weekly data
  const runs = runsData as Pick<ScoreRun, 'performance' | 'accessibility' | 'best_practices' | 'seo' | 'lcp' | 'cls' | 'inp' | 'checked_at'>[] | null

  const chartData = (runs ?? []).map((r) => ({
    date: new Date(r.checked_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    }),
    performance: r.performance,
    accessibility: r.accessibility,
    best_practices: r.best_practices,
    seo: r.seo,
  }))

  const latest = runs?.at(-1)
  const psiUrl = `https://pagespeed.web.dev/report?url=${encodeURIComponent(site.url)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-3"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{site.name}</h1>
            <a
              href={psiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
            >
              {site.url}
              <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </header>

      <main className="px-6 py-8 max-w-4xl mx-auto space-y-8">
        {latest && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Latest Scores
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(
                [
                  ['Performance', latest.performance],
                  ['Accessibility', latest.accessibility],
                  ['Best Practices', latest.best_practices],
                  ['SEO', latest.seo],
                ] as const
              ).map(([label, score]) => (
                <div
                  key={label}
                  className="bg-white rounded-xl border border-gray-200 px-4 py-4 flex flex-col items-center gap-2"
                >
                  <span className="text-xs text-gray-500 font-medium">{label}</span>
                  <ScoreBadge score={score as number | null} />
                </div>
              ))}
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 px-6 py-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
              Score History
            </h2>
            <ScoreHistoryChart data={chartData} />
          </div>
        )}

        {!runs?.length && (
          <p className="text-sm text-gray-400 text-center py-12">
            No score history yet. Run the cron job to collect data.
          </p>
        )}
      </main>
    </div>
  )
}
