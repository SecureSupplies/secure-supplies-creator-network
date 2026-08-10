import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'
import { scanText, hasDisclosure } from '../../src/lib/compliance'

const bodySchema = z.object({
  affiliateId: z.string().uuid(),
  campaignId: z.string().uuid(),
  platform: z.string().min(2),
  liveUrl: z.string().url(),
  contentType: z.enum(['remix', 'original']),
  language: z.string().min(2).max(8),
  disclosureConfirmed: z.boolean(),
  paidTrafficDeclared: z.boolean(),
  caption: z.string().max(5000).optional(),
})

/**
 * create-content-submission — creates a submission and runs the
 * automated compliance text scan. Flags trigger review, never
 * automatic legal conclusions.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Content submission')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const b = parsed.data

  if (!b.disclosureConfirmed) {
    return json({ ok: false, error: 'disclosure_confirmation_required' }, 422)
  }

  const db = serviceClient()
  const { data: submission, error } = await db
    .from('content_submissions')
    .insert({
      affiliate_id: b.affiliateId,
      campaign_id: b.campaignId,
      platform: b.platform,
      live_url: b.liveUrl,
      content_type: b.contentType,
      language: b.language,
      disclosure_confirmed: b.disclosureConfirmed,
      paid_traffic_declared: b.paidTrafficDeclared,
      caption: b.caption ?? null,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') return json({ ok: false, error: 'duplicate_url_for_campaign' }, 409)
    return json({ ok: false, error: error.message }, 500)
  }

  // Automated compliance scan on the caption.
  const caption = b.caption ?? ''
  const hits = scanText(caption)
  if (caption && !hasDisclosure(caption)) {
    hits.push({ id: 'missing_disclosure', label: 'Caption missing affiliate disclosure', match: '' })
  }
  for (const hit of hits) {
    await db.from('compliance_flags').insert({
      affiliate_id: b.affiliateId,
      submission_id: submission.id,
      flag_type: hit.id,
      severity: 'review',
      detail: `${hit.label}${hit.match ? `: "${hit.match}"` : ''}`,
    })
  }

  return json({ ok: true, submissionId: submission.id, complianceFlags: hits.length })
}
