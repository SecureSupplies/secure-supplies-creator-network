import { json, isDemoMode } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

/**
 * resolve-referral — resolves a partner code + offer slug to the
 * Patreon destination URL and the creator's promo code (if any).
 */
export default async (req: Request) => {
  const url = new URL(req.url)
  const partner = url.searchParams.get('partner') ?? ''
  const offer = url.searchParams.get('offer') ?? ''
  if (!/^[A-Z0-9]{4,12}$/.test(partner) || !/^[a-z0-9-]{2,64}$/.test(offer)) {
    return json({ ok: false, error: 'invalid_parameters' }, 400)
  }

  if (isDemoMode() || !hasSupabaseConfig()) {
    return json({
      ok: true,
      demo_mode: true,
      destination_url: 'https://www.patreon.com/cw/securesupplies',
      promo_code: `${partner}-DEMO`,
    })
  }

  const db = serviceClient()
  const { data: offerRow } = await db
    .from('offers')
    .select('id, patreon_url')
    .eq('slug', offer)
    .eq('is_active', true)
    .maybeSingle()
  if (!offerRow) return json({ ok: false, error: 'offer_not_found' }, 404)

  const { data: affiliate } = await db
    .from('affiliate_profiles')
    .select('id')
    .eq('partner_code', partner)
    .maybeSingle()
  let promoCode: string | null = null
  if (affiliate) {
    const { data: code } = await db
      .from('discount_codes')
      .select('code')
      .eq('affiliate_id', affiliate.id)
      .eq('offer_id', offerRow.id)
      .eq('is_active', true)
      .maybeSingle()
    promoCode = code?.code ?? null
  }
  return json({ ok: true, destination_url: offerRow.patreon_url, promo_code: promoCode })
}
