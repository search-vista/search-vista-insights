import { z } from 'zod'

const PSI_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

// Zod schema for the parts of the PSI response we care about
const CategorySchema = z.object({
  score: z.number().nullable(),
})

const AuditRefSchema = z.object({
  id: z.string(),
})

const MetricAuditSchema = z.object({
  numericValue: z.number().optional(),
})

const PsiResponseSchema = z.object({
  lighthouseResult: z.object({
    categories: z.object({
      performance: CategorySchema,
      accessibility: CategorySchema,
      'best-practices': CategorySchema,
      seo: CategorySchema,
    }),
    audits: z.record(
      z.string(),
      z.object({
        numericValue: z.number().optional(),
      })
    ),
  }),
})

export type PsiScores = {
  performance: number | null
  accessibility: number | null
  best_practices: number | null
  seo: number | null
  lcp: number | null
  cls: number | null
  inp: number | null
}

function toScore(raw: number | null): number | null {
  if (raw === null) return null
  return Math.round(raw * 100)
}

export async function fetchPsiScores(url: string): Promise<PsiScores> {
  const apiKey = process.env.PSI_API_KEY
  if (!apiKey) throw new Error('PSI_API_KEY is not set')

  const params = new URLSearchParams({
    url,
    strategy: 'mobile',
    key: apiKey,
    category: 'performance',
    // Passing category multiple times requires appending separately
  })
  // PSI requires repeating the category param for each category
  const fullUrl =
    `${PSI_API_BASE}?${params.toString()}` +
    '&category=accessibility&category=best-practices&category=seo'

  const res = await fetch(fullUrl, { next: { revalidate: 0 } })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`PSI API error ${res.status}: ${body}`)
  }

  const json = await res.json()
  const parsed = PsiResponseSchema.parse(json)

  const { categories, audits } = parsed.lighthouseResult

  return {
    performance: toScore(categories.performance.score),
    accessibility: toScore(categories.accessibility.score),
    best_practices: toScore(categories['best-practices'].score),
    seo: toScore(categories.seo.score),
    // Core Web Vitals — raw values from individual audits
    lcp: audits['largest-contentful-paint']?.numericValue
      ? Number((audits['largest-contentful-paint'].numericValue / 1000).toFixed(2))
      : null,
    cls: audits['cumulative-layout-shift']?.numericValue
      ? Number(audits['cumulative-layout-shift'].numericValue.toFixed(3))
      : null,
    inp: audits['interaction-to-next-paint']?.numericValue
      ? Math.round(audits['interaction-to-next-paint'].numericValue)
      : null,
  }
}
