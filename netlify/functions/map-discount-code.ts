import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

const bodySchema = z.object({
  code: z.string().min(2).max(64),
  partnerCode: z.string().regex(/^[A-Z0-9]{4,12}$/),
  offerSlug: z.string().regex(/^[a-z0-9-]{2,64}$/).optional(),
  campaignSlug: z.string().optional(),
  codeType: z.enum(['product', 'membership']).default('product'),
})

/**
 * map-discount-code — binds a Patreon promotional code to a creator
 * (and optionally an offer/campaign). Membership codes are treated as a
 * feature flag: Patreon membership discounts may not be available on
 * every account, so 'membership' type codes are accepted but marked.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Discount-code mapping')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const db = serviceClient()

  const { data: affiliate } = await db
    .from('affiliate_profiles')
    .select('id')
    .eq('partner_code', parsed.data.partnerCode)
    .maybeSingle()
  if (!affiliate) return json({ ok: false, error: 'partner_not_found' }, 404)

  let offerId: string | null = null
  if (parsed.data.offerSlug) {
    const { data: offer } = await db.from('offers').select('id').eq('slug', parsed.data.offerSlug).maybeSingle()
    offerId = offer?.id ?? null
  }
  let campaignId: string | null = null
  if (parsed.data.campaignSlug) {
    const { data: campaign } = await db.from('campaigns').select('id').eq('slug', parsed.data.campaignSlug).maybeSingle()
    campaignId = campaign?.id ?? null
  }

  const { data, error } = await db
    .from('discount_codes')
    .upsert(
      {
        code: parsed.data.code,
        affiliate_id: affiliate.id,
        offer_id: offerId,
        campaign_id: campaignId,
        code_type: parsed.data.codeType,
      },
      { onConflict: 'code' },
    )
    .select('id')
    .single()
  if (error) return json({ ok: false, error: error.message }, 500)
  await auditLog({ action: 'map_discount_code', entityTable: 'discount_codes', entityId: data.id })
  return json({ ok: true, id: data.id })
}
