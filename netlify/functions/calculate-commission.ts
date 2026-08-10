import { z } from 'zod'
import { json } from '../lib/env'
import { calculateCommission } from '../../src/lib/commission/engine'
import { DEFAULT_RULES } from '../../src/lib/commission/types'

const bodySchema = z.object({
  conversionId: z.string().min(1),
  offerKind: z.enum([
    'monthly_membership',
    'annual_membership',
    'digital_product',
    'launch_product',
    'high_touch',
  ]),
  paymentNumber: z.number().int().min(1),
  attributionMethod: z.enum([
    'promo_code',
    'patreon_identity',
    'tracked_click',
    'manual_claim',
    'organic',
  ]),
  isSelfReferral: z.boolean(),
  campaignBpsOverride: z.number().int().min(0).max(3000).optional(),
  money: z.object({
    currency: z.string().regex(/^[A-Z]{3}$/),
    grossAmountMinor: z.number().int().min(0),
    taxAmountMinor: z.number().int().min(0),
    discountAmountMinor: z.number().int().min(0),
    platformFeeMinor: z.number().int().min(0),
    processingFeeMinor: z.number().int().min(0),
    refundAmountMinor: z.number().int().min(0),
    chargebackAmountMinor: z.number().int().min(0),
    fxFeeMinor: z.number().int().min(0),
    payoutFeeMinor: z.number().int().min(0),
  }),
})

/**
 * calculate-commission — deterministic commission calculation endpoint.
 * Uses the shared engine (same code the tests cover). Pure calculation;
 * persistence happens in finalize-commissions.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return json({ ok: false, error: 'validation_failed', issues: parsed.error.issues }, 400)
  }
  try {
    const result = calculateCommission(parsed.data, DEFAULT_RULES)
    return json({ ok: true, result })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 422)
  }
}
