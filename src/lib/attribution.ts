/**
 * Attribution resolution.
 *
 * Priority (highest wins):
 *   1. Redeemed creator-specific promotional code
 *   2. Authenticated pre-checkout Patreon identity binding
 *   3. Most recent eligible tracked click within the 30-day window
 *   4. Administrator-approved manual claim (submitted within 7 days)
 *   5. Otherwise: direct / organic (no commission)
 *
 * No invasive fingerprinting: clicks carry only a signed click ID,
 * partner/campaign/offer codes, UTM values, landing page, referrer,
 * timestamp and an anonymous first-party visitor ID.
 */

export const ATTRIBUTION_WINDOW_DAYS = 30
export const MANUAL_CLAIM_WINDOW_DAYS = 7

export interface ClickCandidate {
  clickId: string
  partnerCode: string
  clickedAt: string // ISO timestamp
}

export interface AttributionEvidence {
  /** Partner code from a redeemed promo code, if any. */
  redeemedPromoCodePartner?: string
  /** Partner code bound via authenticated Patreon OAuth identity, if any. */
  identityBoundPartner?: string
  /** All tracked clicks that could claim this conversion. */
  clicks: ClickCandidate[]
  /** Approved manual claim partner, if any. */
  approvedManualClaimPartner?: string
  /** Conversion (payment) timestamp, ISO. */
  convertedAt: string
  /** Customer identifier hash — used only to flag self-referrals. */
  customerEmailHash?: string
  /** Partner email hashes keyed by partner code, for self-referral detection. */
  partnerEmailHashes?: Record<string, string>
}

export interface AttributionDecision {
  method: 'promo_code' | 'patreon_identity' | 'tracked_click' | 'manual_claim' | 'organic'
  partnerCode: string | null
  selfReferralFlag: boolean
  reason: string
}

function withinWindow(clickedAt: string, convertedAt: string, days: number): boolean {
  const clicked = Date.parse(clickedAt)
  const converted = Date.parse(convertedAt)
  if (Number.isNaN(clicked) || Number.isNaN(converted)) return false
  const diffMs = converted - clicked
  return diffMs >= 0 && diffMs <= days * 24 * 60 * 60 * 1000
}

export function resolveAttribution(e: AttributionEvidence): AttributionDecision {
  const decide = (
    method: AttributionDecision['method'],
    partnerCode: string | null,
    reason: string,
  ): AttributionDecision => {
    const selfReferralFlag =
      partnerCode !== null &&
      e.customerEmailHash !== undefined &&
      e.partnerEmailHashes?.[partnerCode] === e.customerEmailHash
    return { method, partnerCode, selfReferralFlag, reason }
  }

  if (e.redeemedPromoCodePartner) {
    return decide('promo_code', e.redeemedPromoCodePartner, 'redeemed_promo_code')
  }
  if (e.identityBoundPartner) {
    return decide('patreon_identity', e.identityBoundPartner, 'pre_checkout_identity_binding')
  }
  const eligible = e.clicks
    .filter((c) => withinWindow(c.clickedAt, e.convertedAt, ATTRIBUTION_WINDOW_DAYS))
    .sort((a, b) => Date.parse(b.clickedAt) - Date.parse(a.clickedAt))
  if (eligible.length > 0) {
    return decide('tracked_click', eligible[0].partnerCode, 'most_recent_click_within_30_days')
  }
  if (e.approvedManualClaimPartner) {
    return decide('manual_claim', e.approvedManualClaimPartner, 'admin_approved_manual_claim')
  }
  return decide('organic', null, 'no_eligible_attribution')
}
