import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'
import { calculateContentReward } from '../../src/lib/commission/contentRewards'

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  adminVerifiedViews: z.number().int().min(0),
})

/**
 * calculate-content-reward — computes the reward for an APPROVED
 * submission from administrator-verified qualified views.
 * View rewards settle only after the 30-day observation period.
 * Never exceeds the post cap or the remaining campaign budget.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Content-reward calculation')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const b = parsed.data

  const db = serviceClient()
  const { data: sub } = await db
    .from('content_submissions')
    .select('id, affiliate_id, campaign_id, content_type, status, submitted_at')
    .eq('id', b.submissionId)
    .maybeSingle()
  if (!sub) return json({ ok: false, error: 'submission_not_found' }, 404)
  if (!['approved', 'published', 'reward_pending'].includes(sub.status)) {
    return json({ ok: false, error: 'submission_not_approved' }, 422)
  }

  const { data: campaign } = await db
    .from('campaigns')
    .select('budget_total_minor, budget_spent_minor')
    .eq('id', sub.campaign_id)
    .maybeSingle()
  const remaining = (campaign?.budget_total_minor ?? 0) - (campaign?.budget_spent_minor ?? 0)

  const result = calculateContentReward({
    contentType: sub.content_type as 'remix' | 'original',
    approved: true,
    qualifiedViews: b.adminVerifiedViews,
    campaignBudgetRemainingMinor: remaining,
  })

  const observationEnds = new Date(
    Date.parse(sub.submitted_at ?? new Date().toISOString()) + 30 * 86_400_000,
  ).toISOString()

  const { error } = await db.from('content_rewards').upsert(
    {
      submission_id: sub.id,
      affiliate_id: sub.affiliate_id,
      currency: 'USD',
      approval_bonus_minor: result.approvalBonusMinor,
      qualified_views: b.adminVerifiedViews,
      view_reward_minor: result.viewRewardMinor,
      capped_total_minor: result.cappedTotalMinor,
      payable_minor: result.payableMinor,
      observation_ends_at: observationEnds,
      status: 'held',
    },
    { onConflict: 'submission_id' },
  )
  if (error) return json({ ok: false, error: error.message }, 500)

  await auditLog({
    action: 'calculate_content_reward',
    entityTable: 'content_rewards',
    reason: `submission ${sub.id}: ${result.payableMinor} minor units`,
  })
  return json({ ok: true, result, observation_ends_at: observationEnds })
}
