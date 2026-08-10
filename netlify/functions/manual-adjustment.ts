import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

const bodySchema = z.object({
  affiliateId: z.string().uuid(),
  conversionId: z.string().uuid(),
  adminId: z.string().uuid(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  amountMinor: z.number().int(), // may be negative
  reason: z.string().min(10, 'A mandatory, meaningful reason is required'),
})

/**
 * manual-adjustment — administrator adjustment with MANDATORY reason.
 * Every adjustment is written to the immutable audit log.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Manual adjustment')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed', issues: parsed.error.issues }, 400)
  const b = parsed.data
  const db = serviceClient()

  const { data, error } = await db
    .from('commission_entries')
    .insert({
      conversion_id: b.conversionId,
      affiliate_id: b.affiliateId,
      rule_version: 0,
      entry_kind: 'adjustment',
      currency: b.currency,
      rate_bps: 0,
      commission_amount_minor: b.amountMinor,
      status: 'approved',
      adjustment_reason: b.reason,
    })
    .select('id')
    .single()
  if (error) return json({ ok: false, error: error.message }, 500)

  await auditLog({
    actorId: b.adminId,
    actorRole: 'administrator',
    action: 'manual_adjustment',
    entityTable: 'commission_entries',
    entityId: data.id,
    after: { amountMinor: b.amountMinor, currency: b.currency },
    reason: b.reason,
  })
  return json({ ok: true, entryId: data.id })
}
