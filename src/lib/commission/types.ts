import type { CurrencyCode, MoneyBreakdown } from '../money'

export type OfferKind =
  | 'monthly_membership'
  | 'annual_membership'
  | 'digital_product'
  | 'launch_product'
  | 'high_touch'

export type CommissionStatus =
  | 'estimated'
  | 'attributed'
  | 'pending_payment'
  | 'held'
  | 'approved'
  | 'payable'
  | 'paid'
  | 'reversed'
  | 'disputed'
  | 'cancelled'

export type AttributionMethod =
  | 'promo_code'
  | 'patreon_identity'
  | 'tracked_click'
  | 'manual_claim'
  | 'organic'

/**
 * Versioned commission rule configuration.
 * Rates are basis points (bps). 2500 bps = 25.00%.
 */
export interface CommissionRuleSet {
  version: number
  monthly_membership: {
    first_payment_bps: number
    renewal_bps: number
    renewal_start_number: number
    renewal_end_number: number
  }
  annual_membership: { payment_bps: number }
  digital_product: { payment_bps: number }
  launch_product: { maximum_bps: number }
  high_touch: { first_payment_min_bps: number; first_payment_max_bps: number }
  team_lead_override: {
    enabled: boolean
    bps: number
    maximum_months: number
    maximum_levels: number
  }
  content_rewards: {
    remix: { approval_bonus_minor: number; per_1000_views_minor: number; cap_minor: number }
    original: { approval_bonus_minor: number; per_1000_views_minor: number; cap_minor: number }
  }
}

/** Default configuration — matches the program Commission Schedule. */
export const DEFAULT_RULES: CommissionRuleSet = {
  version: 1,
  monthly_membership: {
    first_payment_bps: 2500,
    renewal_bps: 1500,
    renewal_start_number: 2,
    renewal_end_number: 12,
  },
  annual_membership: { payment_bps: 2000 },
  digital_product: { payment_bps: 2500 },
  launch_product: { maximum_bps: 3000 },
  high_touch: { first_payment_min_bps: 1000, first_payment_max_bps: 1500 },
  team_lead_override: {
    enabled: false, // feature flag OFF by default — never paid for recruiting
    bps: 300,
    maximum_months: 6,
    maximum_levels: 1,
  },
  content_rewards: {
    remix: { approval_bonus_minor: 500, per_1000_views_minor: 125, cap_minor: 15000 },
    original: { approval_bonus_minor: 2000, per_1000_views_minor: 300, cap_minor: 40000 },
  },
}

export interface ConversionInput {
  conversionId: string
  offerKind: OfferKind
  /** 1-based payment sequence number for memberships (1 = first payment). */
  paymentNumber: number
  money: MoneyBreakdown
  attributionMethod: AttributionMethod
  /** True when the purchasing customer is the attributed creator. */
  isSelfReferral: boolean
  /** Campaign-level bps override (e.g. launch promotion). */
  campaignBpsOverride?: number
}

export interface CommissionResult {
  conversionId: string
  ruleVersion: number
  currency: CurrencyCode
  netCollectedRevenueMinor: number
  rateBps: number
  commissionAmountMinor: number
  status: CommissionStatus
  reason: string
}
