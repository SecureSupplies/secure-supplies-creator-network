import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

const scoreSchema = z.object({
  originality: z.number().int().min(0).max(20),
  brand: z.number().int().min(0).max(20),
  hook: z.number().int().min(0).max(20),
  cta: z.number().int().min(0).max(15),
  relevance: z.number().int().min(0).max(15),
  disclosure: z.number().int().min(0).max(10),
})

const bodySchema = z.object({
  submissionId: z.string().uuid(),
  reviewerId: z.string().uuid(),
  decision: z.enum(['approved', 'rejected', 'changes_requested']),
  score: scoreSchema.optional(),
  note: z.string().max(2000).optional(),
})

/** approve-content-submission — reviewer decision with weighted score. */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Submission review')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const b = parsed.data

  const db = serviceClient()
  const { error } = await db
    .from('content_submissions')
    .update({
      status: b.decision,
      review_score: b.score ?? null,
      reviewed_by: b.reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', b.submissionId)
    .in('status', ['submitted', 'under_review'])
  if (error) return json({ ok: false, error: error.message }, 500)

  await auditLog({
    actorId: b.reviewerId,
    action: `submission_${b.decision}`,
    entityTable: 'content_submissions',
    entityId: b.submissionId,
    reason: b.note,
  })
  return json({ ok: true })
}
