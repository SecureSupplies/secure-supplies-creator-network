import { describe, expect, it } from 'vitest'
import { netCollectedRevenueMinor, applyBps, MoneyError, formatMinor } from '../money'
import {
  calculateCommission,
  calculateTeamLeadOverride,
  reverseCommission,
} from './engine'
import { calculateContentReward } from './contentRewards'
import { DEFAULT_RULES, type CommissionRuleSet, type ConversionInput } from './types'
import { resolveAttribution } from '../attribution'

function money(gross: number, overrides: Partial<Parameters<typeof netCollectedRevenueMinor>[0]> = {}) {
  return {
    currency: 'USD',
    grossAmountMinor: gross,
    taxAmountMinor: 0,
    discountAmountMinor: 0,
    platformFeeMinor: 0,
    processingFeeMinor: 0,
    refundAmountMinor: 0,
    chargebackAmountMinor: 0,
    fxFeeMinor: 0,
    payoutFeeMinor: 0,
    ...overrides,
  }
}

function conversion(overrides: Partial<ConversionInput> = {}): ConversionInput {
  return {
    conversionId: 'conv-1',
    offerKind: 'monthly_membership',
    paymentNumber: 1,
    money: money(4900),
    attributionMethod: 'tracked_click',
    isSelfReferral: false,
    ...overrides,
  }
}

describe('Net Collected Revenue', () => {
  it('deducts every cost component from gross', () => {
    const ncr = netCollectedRevenueMinor(
      money(4900, {
        platformFeeMinor: 490, // 10%
        processingFeeMinor: 172, // 2.9% + $0.30 ≈ 142+30
      }),
    )
    expect(ncr).toBe(4900 - 490 - 172) // 4238 = $42.38
  })

  it('clamps to zero and never goes negative', () => {
    expect(netCollectedRevenueMinor(money(1000, { refundAmountMinor: 5000 }))).toBe(0)
  })

  it('rejects non-integer (floating point) money', () => {
    expect(() => netCollectedRevenueMinor(money(49.99 as unknown as number))).toThrow(MoneyError)
  })

  it('formats minor units for display only', () => {
    expect(formatMinor(4238, 'USD')).toBe('USD 42.38')
    expect(formatMinor(-500, 'AUD')).toBe('-AUD 5.00')
  })
})

describe('applyBps', () => {
  it('uses integer arithmetic and floors', () => {
    expect(applyBps(4238, 2500)).toBe(1059) // $10.59 — matches plan example
    expect(applyBps(4238, 1500)).toBe(635) // floor(635.7) = $6.35
  })
  it('rejects invalid bps', () => {
    expect(() => applyBps(100, 10001)).toThrow(MoneyError)
    expect(() => applyBps(100, -1)).toThrow(MoneyError)
  })
})

describe('membership commissions', () => {
  const fees = { platformFeeMinor: 490, processingFeeMinor: 172 }

  it('pays 25% of NCR on the first monthly payment', () => {
    const r = calculateCommission(conversion({ money: money(4900, fees) }))
    expect(r.netCollectedRevenueMinor).toBe(4238)
    expect(r.rateBps).toBe(2500)
    expect(r.commissionAmountMinor).toBe(1059)
    expect(r.status).toBe('estimated')
    expect(r.ruleVersion).toBe(1)
  })

  it('pays 15% on renewals 2 through 12', () => {
    for (const n of [2, 6, 12]) {
      const r = calculateCommission(conversion({ paymentNumber: n, money: money(4900, fees) }))
      expect(r.rateBps).toBe(1500)
      expect(r.commissionAmountMinor).toBe(applyBps(4238, 1500))
    }
  })

  it('pays nothing after month 12 without a campaign override', () => {
    const r = calculateCommission(conversion({ paymentNumber: 13 }))
    expect(r.commissionAmountMinor).toBe(0)
    expect(r.status).toBe('cancelled')
  })

  it('honours a campaign override after month 12', () => {
    const r = calculateCommission(
      conversion({ paymentNumber: 13, campaignBpsOverride: 500, money: money(4900, fees) }),
    )
    expect(r.rateBps).toBe(500)
    expect(r.commissionAmountMinor).toBe(applyBps(4238, 500))
  })

  it('pays 20% on annual memberships', () => {
    const r = calculateCommission(
      conversion({ offerKind: 'annual_membership', money: money(49900) }),
    )
    expect(r.rateBps).toBe(2000)
    expect(r.commissionAmountMinor).toBe(applyBps(49900, 2000))
  })
})

describe('product commissions', () => {
  it('pays 25% on digital products', () => {
    const r = calculateCommission(conversion({ offerKind: 'digital_product', money: money(5600) }))
    expect(r.rateBps).toBe(2500)
    expect(r.commissionAmountMinor).toBe(1400)
  })

  it('caps launch campaigns at 30%', () => {
    const r = calculateCommission(
      conversion({ offerKind: 'launch_product', campaignBpsOverride: 5000, money: money(10000) }),
    )
    expect(r.rateBps).toBe(3000)
  })

  it('high-touch pays first payment only', () => {
    const first = calculateCommission(conversion({ offerKind: 'high_touch', money: money(100000) }))
    expect(first.rateBps).toBe(1500)
    const second = calculateCommission(
      conversion({ offerKind: 'high_touch', paymentNumber: 2, money: money(100000) }),
    )
    expect(second.commissionAmountMinor).toBe(0)
  })
})

describe('guardrails', () => {
  it('never pays self-referrals', () => {
    const r = calculateCommission(conversion({ isSelfReferral: true }))
    expect(r.commissionAmountMinor).toBe(0)
    expect(r.reason).toBe('self_referral_not_commissionable')
  })

  it('never pays organic conversions', () => {
    const r = calculateCommission(conversion({ attributionMethod: 'organic' }))
    expect(r.commissionAmountMinor).toBe(0)
  })

  it('is deterministic and idempotent', () => {
    const a = calculateCommission(conversion())
    const b = calculateCommission(conversion())
    expect(a).toEqual(b)
  })

  it('keeps currencies separate — result carries source currency', () => {
    const r = calculateCommission(conversion({ money: money(4900, {}) }))
    expect(r.currency).toBe('USD')
    const eur = calculateCommission(
      conversion({ money: { ...money(4900), currency: 'EUR' } }),
    )
    expect(eur.currency).toBe('EUR')
  })
})

describe('refunds, chargebacks, reversals', () => {
  const original = calculateCommission(
    conversion({ money: money(4900, { platformFeeMinor: 490, processingFeeMinor: 172 }) }),
  )

  it('fully reverses a full refund', () => {
    const rev = reverseCommission(original, original.netCollectedRevenueMinor, 'refund')
    expect(rev.reversalAmountMinor).toBe(-original.commissionAmountMinor)
    expect(rev.remainingCommissionMinor).toBe(0)
    expect(rev.status).toBe('reversed')
  })

  it('prorates a partial refund', () => {
    const rev = reverseCommission(original, Math.floor(original.netCollectedRevenueMinor / 2), 'refund')
    expect(rev.reversalAmountMinor).toBeLessThan(0)
    expect(Math.abs(rev.reversalAmountMinor)).toBeLessThan(original.commissionAmountMinor)
    expect(rev.remainingCommissionMinor + Math.abs(rev.reversalAmountMinor)).toBe(
      original.commissionAmountMinor,
    )
  })

  it('fully reverses on chargeback regardless of amount', () => {
    const rev = reverseCommission(original, 1, 'chargeback')
    expect(rev.reversalAmountMinor).toBe(-original.commissionAmountMinor)
    expect(rev.reason).toBe('chargeback_full_reversal')
  })
})

describe('content rewards', () => {
  it('remix: $5 bonus + $1.25 per 1,000 qualified views', () => {
    const r = calculateContentReward({
      contentType: 'remix',
      approved: true,
      qualifiedViews: 20000,
      campaignBudgetRemainingMinor: 1000000,
    })
    expect(r.approvalBonusMinor).toBe(500)
    expect(r.viewRewardMinor).toBe(2500)
    expect(r.payableMinor).toBe(3000)
  })

  it('caps remix at $150 per post', () => {
    const r = calculateContentReward({
      contentType: 'remix',
      approved: true,
      qualifiedViews: 10_000_000,
      campaignBudgetRemainingMinor: 1000000,
    })
    expect(r.payableMinor).toBe(15000)
  })

  it('original UGC: $20 + $3 CPM capped at $400', () => {
    const r = calculateContentReward({
      contentType: 'original',
      approved: true,
      qualifiedViews: 50000,
      campaignBudgetRemainingMinor: 1000000,
    })
    expect(r.payableMinor).toBe(2000 + 15000)
    const capped = calculateContentReward({
      contentType: 'original',
      approved: true,
      qualifiedViews: 10_000_000,
      campaignBudgetRemainingMinor: 1000000,
    })
    expect(capped.payableMinor).toBe(40000)
  })

  it('never exceeds remaining campaign budget', () => {
    const r = calculateContentReward({
      contentType: 'original',
      approved: true,
      qualifiedViews: 100000,
      campaignBudgetRemainingMinor: 1200,
    })
    expect(r.payableMinor).toBe(1200)
    expect(r.budgetLimited).toBe(true)
  })

  it('pays nothing when not approved', () => {
    const r = calculateContentReward({
      contentType: 'remix',
      approved: false,
      qualifiedViews: 99999,
      campaignBudgetRemainingMinor: 1000000,
    })
    expect(r.payableMinor).toBe(0)
  })
})

describe('Certified Team Lead override', () => {
  const enabledRules: CommissionRuleSet = {
    ...DEFAULT_RULES,
    team_lead_override: { ...DEFAULT_RULES.team_lead_override, enabled: true },
  }

  it('is disabled by default — pays 0 even with qualifying sales', () => {
    expect(
      calculateTeamLeadOverride({
        rules: DEFAULT_RULES,
        level: 1,
        monthsSinceSupervisionStart: 1,
        verifiedRetailNcrMinor: 100000,
        hasDocumentedSupervision: true,
      }),
    ).toBe(0)
  })

  it('pays 3% of verified retail NCR when enabled, level 1, within 6 months', () => {
    expect(
      calculateTeamLeadOverride({
        rules: enabledRules,
        level: 1,
        monthsSinceSupervisionStart: 3,
        verifiedRetailNcrMinor: 100000,
        hasDocumentedSupervision: true,
      }),
    ).toBe(3000)
  })

  it('never pays beyond one level', () => {
    expect(
      calculateTeamLeadOverride({
        rules: enabledRules,
        level: 2,
        monthsSinceSupervisionStart: 1,
        verifiedRetailNcrMinor: 100000,
        hasDocumentedSupervision: true,
      }),
    ).toBe(0)
  })

  it('never pays for recruitment alone (zero retail revenue)', () => {
    expect(
      calculateTeamLeadOverride({
        rules: enabledRules,
        level: 1,
        monthsSinceSupervisionStart: 1,
        verifiedRetailNcrMinor: 0,
        hasDocumentedSupervision: true,
      }),
    ).toBe(0)
  })

  it('stops after six months', () => {
    expect(
      calculateTeamLeadOverride({
        rules: enabledRules,
        level: 1,
        monthsSinceSupervisionStart: 6,
        verifiedRetailNcrMinor: 100000,
        hasDocumentedSupervision: true,
      }),
    ).toBe(0)
  })

  it('requires documented supervision', () => {
    expect(
      calculateTeamLeadOverride({
        rules: enabledRules,
        level: 1,
        monthsSinceSupervisionStart: 1,
        verifiedRetailNcrMinor: 100000,
        hasDocumentedSupervision: false,
      }),
    ).toBe(0)
  })
})

describe('attribution priority', () => {
  const base = {
    convertedAt: '2026-08-01T00:00:00Z',
    clicks: [
      { clickId: 'c1', partnerCode: 'AB12', clickedAt: '2026-07-20T00:00:00Z' },
      { clickId: 'c2', partnerCode: 'CD34', clickedAt: '2026-07-25T00:00:00Z' },
    ],
  }

  it('promo code beats identity and clicks', () => {
    const d = resolveAttribution({
      ...base,
      redeemedPromoCodePartner: 'ZZ99',
      identityBoundPartner: 'AB12',
    })
    expect(d.method).toBe('promo_code')
    expect(d.partnerCode).toBe('ZZ99')
  })

  it('identity binding beats clicks', () => {
    const d = resolveAttribution({ ...base, identityBoundPartner: 'AB12' })
    expect(d.method).toBe('patreon_identity')
  })

  it('most recent click within 30 days wins', () => {
    const d = resolveAttribution({ ...base })
    expect(d.method).toBe('tracked_click')
    expect(d.partnerCode).toBe('CD34')
  })

  it('ignores clicks outside the 30-day window', () => {
    const d = resolveAttribution({
      convertedAt: '2026-08-01T00:00:00Z',
      clicks: [{ clickId: 'c1', partnerCode: 'AB12', clickedAt: '2026-06-01T00:00:00Z' }],
    })
    expect(d.method).toBe('organic')
    expect(d.partnerCode).toBeNull()
  })

  it('falls back to approved manual claim, then organic', () => {
    const d = resolveAttribution({
      convertedAt: '2026-08-01T00:00:00Z',
      clicks: [],
      approvedManualClaimPartner: 'MN56',
    })
    expect(d.method).toBe('manual_claim')
  })

  it('flags self-referrals', () => {
    const d = resolveAttribution({
      ...base,
      customerEmailHash: 'hash-x',
      partnerEmailHashes: { CD34: 'hash-x' },
    })
    expect(d.selfReferralFlag).toBe(true)
  })
})
