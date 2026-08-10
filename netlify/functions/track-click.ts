import type { Context } from '@netlify/functions'
import { randomUUID, createHmac } from 'node:crypto'
import { isDemoMode, json, rateLimit, requireEnv } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

/**
 * track-click — records a referral click and redirects to the offer.
 * Route shape: /api/track-click?partner=AB12&offer=coil-calculator&...utm
 * (The /r/:partnerCode/:offerSlug client route calls this then redirects.)
 * No invasive fingerprinting: anonymous first-party visitor cookie only.
 */
export default async (req: Request, context: Context) => {
  const url = new URL(req.url)
  const partner = url.searchParams.get('partner') ?? ''
  const offer = url.searchParams.get('offer') ?? ''
  if (!/^[A-Z0-9]{4,12}$/.test(partner) || !/^[a-z0-9-]{2,64}$/.test(offer)) {
    return json({ ok: false, error: 'invalid_partner_or_offer' }, 400)
  }
  if (!rateLimit(`click:${context.ip ?? 'unknown'}`, 120)) {
    return json({ ok: false, error: 'rate_limited' }, 429)
  }

  const clickId = randomUUID()
  const signature = createHmac('sha256', requireEnv('TOKEN_ENCRYPTION_KEY'))
    .update(clickId)
    .digest('hex')
    .slice(0, 24)
  const signedClickId = `${clickId}.${signature}`

  const cookieHeader = req.headers.get('cookie') ?? ''
  const existingVisitor = /ss_vid=([a-f0-9-]+)/.exec(cookieHeader)?.[1]
  const visitorId = existingVisitor ?? randomUUID()

  if (!isDemoMode() && hasSupabaseConfig()) {
    const db = serviceClient()
    const { data: link } = await db
      .from('referral_links')
      .select('id, affiliate_id, campaign_id, offer_id')
      .eq('slug', offer)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle()
    if (link) {
      await db.from('click_events').insert({
        click_id: signedClickId,
        referral_link_id: link.id,
        affiliate_id: link.affiliate_id,
        campaign_id: link.campaign_id,
        offer_id: link.offer_id,
        utm: Object.fromEntries(
          [...url.searchParams.entries()].filter(([k]) => k.startsWith('utm_')),
        ),
        landing_page: url.searchParams.get('landing') ?? null,
        referrer: req.headers.get('referer') ?? null,
        visitor_id: visitorId,
        user_agent_class: (req.headers.get('user-agent') ?? '').includes('Mobile')
          ? 'mobile'
          : 'desktop',
      })
    }
  }

  const thirtyDays = 30 * 24 * 60 * 60
  const headers = new Headers({ 'content-type': 'application/json' })
  headers.append(
    'set-cookie',
    `ss_vid=${visitorId}; Max-Age=${thirtyDays}; Path=/; SameSite=Lax; Secure; HttpOnly`,
  )
  headers.append(
    'set-cookie',
    `ss_click=${encodeURIComponent(signedClickId)}:${partner}; Max-Age=${thirtyDays}; Path=/; SameSite=Lax; Secure; HttpOnly`,
  )
  return new Response(
    JSON.stringify({ ok: true, click_id: signedClickId, demo_mode: isDemoMode() }),
    { status: 200, headers },
  )
}
