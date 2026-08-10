import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

const bodySchema = z.object({ affiliateId: z.string().uuid() })

/**
 * fraud-evaluate — runs fraud heuristics for one creator and files
 * compliance flags. Detection details are staff-only (RLS revokes the
 * `detail` column from creators). Flags trigger review, not verdicts.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Fraud evaluation')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const { affiliateId } = parsed.data
  const db = serviceClient()
  const flags: Array<{ flag_type: string; severity: string; detail: string }> = []

  // 1. Click burst: > 500 clicks in the last hour.
  const hourAgo = new Date(Date.now() - 3_600_000).toISOString()
  const { count: recentClicks } = await db
    .from('click_events')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .gte('clicked_at', hourAgo)
  if ((recentClicks ?? 0) > 500) {
    flags.push({ flag_type: 'click_burst', severity: 'serious', detail: `${recentClicks} clicks in 1h` })
  }

  // 2. Impossible conversion rate: conversions > 30% of clicks (30d).
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString()
  const { count: clicks30 } = await db
    .from('click_events')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .gte('clicked_at', monthAgo)
  const { count: conversions30 } = await db
    .from('commission_entries')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .eq('entry_kind', 'retail')
    .gte('created_at', monthAgo)
  if ((clicks30 ?? 0) >= 20 && (conversions30 ?? 0) > (clicks30 ?? 0) * 0.3) {
    flags.push({
      flag_type: 'impossible_conversion_rate',
      severity: 'serious',
      detail: `${conversions30} conversions from ${clicks30} clicks in 30d`,
    })
  }

  // 3. Repeated refund activity: > 3 reversals in 30 days.
  const { count: reversals } = await db
    .from('commission_entries')
    .select('id', { count: 'exact', head: true })
    .eq('affiliate_id', affiliateId)
    .eq('entry_kind', 'reversal')
    .gte('created_at', monthAgo)
  if ((reversals ?? 0) > 3) {
    flags.push({ flag_type: 'repeated_refunds', severity: 'review', detail: `${reversals} reversals in 30d` })
  }

  // 4. Duplicate published URLs across campaigns.
  const { data: dupes } = await db
    .from('content_submissions')
    .select('live_url')
    .eq('affiliate_id', affiliateId)
  const urlCounts = new Map<string, number>()
  for (const s of dupes ?? []) urlCounts.set(s.live_url, (urlCounts.get(s.live_url) ?? 0) + 1)
  for (const [url, n] of urlCounts) {
    if (n > 1) flags.push({ flag_type: 'duplicate_published_url', severity: 'review', detail: `${url} submitted ${n}x` })
  }

  for (const f of flags) {
    await db.from('compliance_flags').insert({ affiliate_id: affiliateId, ...f })
  }
  // Response intentionally omits detection thresholds and details.
  return json({ ok: true, flagsFiled: flags.length })
}
