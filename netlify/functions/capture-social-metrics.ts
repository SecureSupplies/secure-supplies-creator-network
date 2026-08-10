import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  viewCount: z.number().int().min(0),
  engagementCount: z.number().int().min(0).optional(),
  source: z.enum(['platform_api', 'provider_import', 'manual_evidence']),
})

/**
 * capture-social-metrics — records a metric snapshot for a submission.
 * Rewards are NEVER auto-approved from creator-entered counts:
 * manual_evidence snapshots require administrator verification, and
 * suspicious growth versus the prior snapshot is flagged for review.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Metric capture')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const b = parsed.data

  const db = serviceClient()
  const { data: prior } = await db
    .from('social_metric_snapshots')
    .select('view_count, captured_at')
    .eq('submission_id', b.submissionId)
    .order('captured_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Suspicious growth: >20x in under 24h from a non-trivial base.
  let suspicious = false
  if (prior && prior.view_count > 500) {
    const hours = (Date.now() - Date.parse(prior.captured_at)) / 3_600_000
    if (hours < 24 && b.viewCount > prior.view_count * 20) suspicious = true
  }

  const { data, error } = await db
    .from('social_metric_snapshots')
    .insert({
      submission_id: b.submissionId,
      view_count: b.viewCount,
      engagement_count: b.engagementCount ?? null,
      source: b.source,
      suspicious_growth_flag: suspicious,
    })
    .select('id')
    .single()
  if (error) return json({ ok: false, error: error.message }, 500)

  if (suspicious) {
    const { data: sub } = await db
      .from('content_submissions')
      .select('affiliate_id')
      .eq('id', b.submissionId)
      .maybeSingle()
    await db.from('compliance_flags').insert({
      affiliate_id: sub?.affiliate_id ?? null,
      submission_id: b.submissionId,
      flag_type: 'suspicious_view_growth',
      severity: 'serious',
      detail: `View count jumped from ${prior?.view_count} to ${b.viewCount} in <24h`,
    })
  }
  return json({ ok: true, snapshotId: data.id, suspicious })
}
