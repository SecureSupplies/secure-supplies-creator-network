import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'
import { reverseCommission } from '../../src/lib/commission/engine'
import type { CommissionResult } from '../../src/lib/commission/types'

const bodySchema = z.object({
  commissionEntryId: z.string().uuid(),
  refundedMinor: z.number().int().min(0),
  kind: z.enum(['refund', 'chargeback']).default('refund'),
  reason: z.string().min(3),
})

/**
 * reverse-commission — refund/chargeback clawback.
 * Creates a negative reversal entry; negative balances carry forward.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Commission reversal')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)

  const db = serviceClient()
  const { data: entry } = await db
    .from('commission_entries')
    .select('*')
    .eq('id', parsed.data.commissionEntryId)
    .maybeSingle()
  if (!entry) return json({ ok: false, error: 'entry_not_found' }, 404)
  if (entry.entry_kind === 'reversal') return json({ ok: false, error: 'already_a_reversal' }, 422)

  const { data: conv } = await db
    .from('conversions')
    .select('net_collected_revenue_minor')
    .eq('id', entry.conversion_id)
    .maybeSingle()

  const original: CommissionResult = {
    conversionId: entry.conversion_id,
    ruleVersion: entry.rule_version,
    currency: entry.currency,
    netCollectedRevenueMinor: conv?.net_collected_revenue_minor ?? 0,
    rateBps: entry.rate_bps,
    commissionAmountMinor: entry.commission_amount_minor,
    status: entry.status,
    reason: 'stored',
  }
  const reversal = reverseCommission(original, parsed.data.refundedMinor, parsed.data.kind)

  const { data: created, error } = await db
    .from('commission_entries')
    .insert({
      conversion_id: entry.conversion_id,
      affiliate_id: entry.affiliate_id,
      rule_version: entry.rule_version,
      entry_kind: 'reversal',
      currency: entry.currency,
      rate_bps: entry.rate_bps,
      commission_amount_minor: reversal.reversalAmountMinor,
      status: 'reversed',
      adjustment_reason: parsed.data.reason,
    })
    .select('id')
    .single()
  if (error) return json({ ok: false, error: error.message }, 500)

  await db.from('commission_entries').update({ status: 'reversed' }).eq('id', entry.id)
  await auditLog({
    action: 'reverse_commission',
    entityTable: 'commission_entries',
    entityId: created.id,
    before: entry,
    after: reversal,
    reason: parsed.data.reason,
  })
  return json({ ok: true, reversal })
}
