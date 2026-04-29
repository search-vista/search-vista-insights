import { NextResponse } from 'next/server'
import pLimit from 'p-limit'
import { getSupabase, type Site } from '@/lib/supabase'
import { fetchPsiScores } from '@/lib/psi'

// Concurrency cap: 3 simultaneous PSI requests prevents 429 rate-limit errors
const CONCURRENCY = 3

// Soft timeout: stop processing new sites if within this many ms of Vercel's limit
const SOFT_TIMEOUT_MS = 55_000
const SLACK_ALERT_DROP_THRESHOLD = 10

export async function GET(req: Request) {
  return runCollection(req)
}

export async function POST(req: Request) {
  return runCollection(req)
}

async function runCollection(req: Request) {
  // Vercel cron sends: Authorization: Bearer <CRON_SECRET>
  // Manual curl sends: x-cron-secret: <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const secret = bearerToken ?? req.headers.get('x-cron-secret')

  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  const supabase = getSupabase()

  // Fetch all active sites (status = 1)
  const { data: sitesData, error: sitesError } = await supabase
    .from('sites')
    .select('id, name, url')
    .eq('status', 1)
  const sites = sitesData as Pick<Site, 'id' | 'name' | 'url'>[] | null

  if (sitesError || !sites) {
    console.error('Failed to fetch sites:', sitesError)
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 })
  }

  const limit = pLimit(CONCURRENCY)
  const results: { siteId: string; success: boolean }[] = []
  const skipped: string[] = []

  const tasks = sites.map((site) =>
    limit(async () => {
      // Soft timeout check — abort remaining tasks if we're running close to the limit
      if (Date.now() - startTime > SOFT_TIMEOUT_MS) {
        skipped.push(site.url)
        return
      }

      try {
        const scores = await fetchPsiScores(site.url)

        const { error: insertError } = await (supabase.from('score_runs').insert as Function)({
          site_id: site.id,
          ...scores,
        })

        if (insertError) throw insertError

        // Slack alert: check for performance drop
        await maybeAlertSlack(site.id, site.name, site.url, scores.performance)

        results.push({ siteId: site.id, success: true })
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error(`Failed to collect scores for ${site.url}:`, message)

        // Store the error so it's visible in the dashboard
        await (supabase.from('score_runs').insert as Function)({
          site_id: site.id,
          performance: null,
          accessibility: null,
          best_practices: null,
          seo: null,
          lcp: null,
          cls: null,
          inp: null,
          error: message,
        })

        results.push({ siteId: site.id, success: false })
      }
    })
  )

  await Promise.all(tasks)

  const summary = {
    total: sites.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    skipped: skipped.length,
    skippedUrls: skipped,
    durationMs: Date.now() - startTime,
  }

  console.log('Cron collect complete:', summary)
  return NextResponse.json(summary)
}

async function maybeAlertSlack(
  siteId: string,
  siteName: string,
  siteUrl: string,
  newPerformance: number | null
) {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL
  if (!webhookUrl || newPerformance === null) return

  // Fetch the previous score run
  const { data: perfData } = await getSupabase()
    .from('score_runs')
    .select('performance')
    .eq('site_id', siteId)
    .not('performance', 'is', null)
    .order('checked_at', { ascending: false })
    .limit(2)
  const data = perfData as { performance: number | null }[] | null

  // data[0] is the run we just inserted, data[1] is the previous one
  const previousPerformance = data?.[1]?.performance
  if (previousPerformance === null || previousPerformance === undefined) return

  const drop = previousPerformance - newPerformance
  if (drop >= SLACK_ALERT_DROP_THRESHOLD) {
    const psiUrl = `https://pagespeed.web.dev/report?url=${encodeURIComponent(siteUrl)}`
    const dashboardUrl = 'https://search-vista-insights.vercel.app/'
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `\u26a0\ufe0f *Performance drop detected for ${siteName}*\nPrevious: ${previousPerformance} \u2192 New: ${newPerformance} (\u2212${drop} points)\n<${psiUrl}|View PSI Report> \u00b7 <${dashboardUrl}|Open Dashboard>`,
      }),
    })
  }
}
