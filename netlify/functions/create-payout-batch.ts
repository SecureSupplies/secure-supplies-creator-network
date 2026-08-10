import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

const MINIMUM_PAYOUT_MINOR = 5000 // $50 minimum

const bodySchema = z.object({
  currency: z.string().regex(/^[A-Z]{3}$/),
  createdBy: z.string().uuid(),
  batchReference: z.string().min(4).max(64),
})

/**
 * create-payout-batch — gathers all payable commission entries and
 * settled content rewards per creator, applies the $50 minimum and
 * negative-balance carry-forward, and creates a draft batch.
 * No real payments are executed — payment confirmation is manual (MVP)
 * or via a future payout-provider integration.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Payout batch creation')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const b = parsed.data
  const db = serviceClient()

  // Payable retail commissions (positive) + reversals (negative) per creator.
  const { data: entries } = await db
    .from('commission_entries')
    .select('id, affiliate_id, commission_amount_minor')
    .in('status', ['payable', 'reversed'])
    .is('payout_item_id', null)
    .eq('currency', b.currency)
  const { data: rewards } = await db
    .from('content_rewards')
    .select('id, affiliate_id, payable_minor, observation_ends_at')
    .eq('status', 'held')
    .is('payout_item_id', null)
    .lte('observation_ends_at', new Date().toISOString())
    .eq('currency', b.currency)

  const balances = new Map<string, number>()
  for (const e of entries ?? []) {
    balances.set(e.affiliate_id, (balances.get(e.affiliate_id) ?? 0) + e.commission_amount_minor)
  }
  for (const r of rewards ?? []) {
    balances.set(r.affiliate_id, (balances.get(r.affiliate_id) ?? 0) + r.payable_minor)
  }

  const { data: batch, error: batchError } = await db
    .from('payout_batches')
    .insert({
      batch_reference: b.batchReference,
      currency: b.currency,
      status: 'draft',
      created_by: b.createdBy,
    })
    .select('id')
    .single()
  if (batchError) return json({ ok: false, error: batchError.message }, 500)

  let total = 0
  let itemCount = 0
  let belowMinimum = 0
  let negativeCarried = 0
  for (const [affiliateId, amount] of balances) {
    if (amount < 0) {
      negativeCarried += 1 // negative balances carry forward to future periods
      continue
    }
    if (amount < MINIMUM_PAYOUT_MINOR) {
      belowMinimum += 1
      continue
    }
    const { data: item } = await db
      .from('payout_items')
      .insert({
        batch_id: batch.id,
        affiliate_id: affiliateId,
        currency: b.currency,
        amount_minor: amount,
        status: 'draft',
      })
      .select('id')
      .single()
    if (item) {
      await db
        .from('commission_entries')
        .update({ payout_item_id: item.id })
        .eq('affiliate_id', affiliateId)
        .in('status', ['payable'])
        .is('payout_item_id', null)
      await db
        .from('content_rewards')
        .update({ payout_item_id: item.id, status: 'payable' })
        .eq('affiliate_id', affiliateId)
        .eq('status', 'held')
        .is('payout_item_id', null)
        .lte('observation_ends_at', new Date().toISOString())
      total += amount
      itemCount += 1
    }
  }
  await db.from('payout_batches').update({ total_amount_minor: total }).eq('id', batch.id)
  await auditLog({
    actorId: b.createdBy,
    action: 'create_payout_batch',
    entityTable: 'payout_batches',
    entityId: batch.id,
    reason: `${itemCount} items, ${total} minor units, ${belowMinimum} below minimum, ${negativeCarried} negative carried`,
  })
  return json({ ok: true, batchId: batch.id, itemCount, totalMinor: total, belowMinimum, negativeCarried })
}
