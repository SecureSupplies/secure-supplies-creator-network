/**
 * Versioned, deterministic commission engine.
 *
 * Guarantees:
 *  - Integer minor-unit arithmetic only (no floating point money).
 *  - Deterministic: same input + same rule version = same output.
 *  - No commission for recruitment. Ever.
 *  - No self-referral commissions.
 *  - Refunds and chargebacks reverse commissions (with partial proration).
 *  - Rule version is preserved on every result.
 */
import {
  applyBps,
  assertMinorUnits,
  netCollectedRevenueMinor,
  type MoneyBreakdown,
} from '../money'
import type {
  CommissionResult,
  CommissionRuleSet,
  ConversionInput,
} from './types'
import { DEFAULT_RULES } from './types'

export class CommissionError extends Error {}

function zeroResult(
  input: ConversionInput,
  rules: CommissionRuleSet,
  ncr: number,
  reason: string,
): CommissionResult {
  return {
    conversionId: input.conversionId,
    ruleVersion: rules.version,
    currency: input.money.currency,
    netCollectedRevenueMinor: ncr,
    rateBps: 0,
    commissionAmountMinor: 0,
    status: 'cancelled',
    reason,
  }
}

/** Resolve the applicable bps rate for a conversion. */
export function resolveRateBps(input: ConversionInput, rules: CommissionRuleSet): number {
  const override = input.campaignBpsOverride
  switch (input.offerKind) {
    case 'monthly_membership': {
      const m = rules.monthly_membership
      if (input.paymentNumber <= 0) throw new CommissionError('paymentNumber must be >= 1')
      if (input.paymentNumber === 1) return override ?? m.first_payment_bps
      if (
        input.paymentNumber >= m.renewal_start_number &&
        input.paymentNumber <= m.renewal_end_number
      ) {
        return override ?? m.renewal_bps
      }
      // After month 12: no recurring commission unless the campaign overrides it.
      return override ?? 0
    }
    case 'annual_membership':
      return override ?? rules.annual_membership.payment_bps
    case 'digital_product':
      return override ?? rules.digital_product.payment_bps
    case 'launch_product': {
      const capped = Math.min(
        override ?? rules.launch_product.maximum_bps,
        rules.launch_product.maximum_bps,
      )
      return capped
    }
    case 'high_touch': {
      if (input.paymentNumber !== 1) return 0 // first payment only
      const h = rules.high_touch
      const rate = override ?? h.first_payment_max_bps
      return Math.min(Math.max(rate, 0), h.first_payment_max_bps)
    }
    default:
      throw new CommissionError(`Unknown offer kind: ${String(input.offerKind)}`)
  }
}

/** Calculate a commission for a conversion. Deterministic and idempotent. */
export function calculateCommission(
  input: ConversionInput,
  rules: CommissionRuleSet = DEFAULT_RULES,
): CommissionResult {
  const ncr = netCollectedRevenueMinor(input.money)

  if (input.isSelfReferral) {
    return zeroResult(input, rules, ncr, 'self_referral_not_commissionable')
  }
  if (input.attributionMethod === 'organic') {
    return zeroResult(input, rules, ncr, 'organic_no_attribution')
  }
  if (ncr === 0) {
    return zeroResult(input, rules, ncr, 'zero_net_collected_revenue')
  }

  const rateBps = resolveRateBps(input, rules)
  if (rateBps === 0) {
    return zeroResult(input, rules, ncr, 'no_rate_for_payment_number')
  }

  return {
    conversionId: input.conversionId,
    ruleVersion: rules.version,
    currency: input.money.currency,
    netCollectedRevenueMinor: ncr,
    rateBps,
    commissionAmountMinor: applyBps(ncr, rateBps),
    status: 'estimated',
    reason: 'calculated',
  }
}

export interface ReversalResult {
  conversionId: string
  ruleVersion: number
  currency: string
  /** Negative amount clawed back from the creator's balance. */
  reversalAmountMinor: number
  remainingCommissionMinor: number
  status: 'reversed' | 'approved'
  reason: string
}

/**
 * Reverse a commission after a refund or chargeback.
 * Partial refunds are prorated against the original NCR.
 * Reversal amounts are negative; negative balances carry forward.
 */
export function reverseCommission(
  original: CommissionResult,
  refundedMinor: number,
  kind: 'refund' | 'chargeback' = 'refund',
): ReversalResult {
  assertMinorUnits(refundedMinor, 'refundedMinor')
  if (refundedMinor < 0) throw new CommissionError('refundedMinor must be >= 0')
  if (original.netCollectedRevenueMinor <= 0 || original.commissionAmountMinor <= 0) {
    return {
      conversionId: original.conversionId,
      ruleVersion: original.ruleVersion,
      currency: original.currency,
      reversalAmountMinor: 0,
      remainingCommissionMinor: original.commissionAmountMinor,
      status: 'approved',
      reason: 'nothing_to_reverse',
    }
  }
  // Chargebacks always fully reverse; refunds prorate.
  const fraction =
    kind === 'chargeback'
      ? 10000
      : Math.min(
          10000,
          Math.floor((refundedMinor * 10000) / original.netCollectedRevenueMinor),
        )
  const reversal = Math.floor((original.commissionAmountMinor * fraction) / 10000)
  const remaining = original.commissionAmountMinor - reversal
  return {
    conversionId: original.conversionId,
    ruleVersion: original.ruleVersion,
    currency: original.currency,
    reversalAmountMinor: -reversal,
    remainingCommissionMinor: remaining,
    status: reversal > 0 ? 'reversed' : 'approved',
    reason: kind === 'chargeback' ? 'chargeback_full_reversal' : 'refund_prorated_reversal',
  }
}

/**
 * Certified Team Lead override.
 * HARD RULES enforced here, not just by configuration:
 *  - Returns 0 unless the feature flag is enabled.
 *  - One level maximum — any level > 1 always pays 0.
 *  - Six-month maximum from supervision start.
 *  - Paid ONLY on verified retail revenue (a real conversion with NCR > 0).
 *  - NEVER paid for recruiting: a recruit with no retail sales generates 0.
 */
export function calculateTeamLeadOverride(params: {
  rules: CommissionRuleSet
  level: number
  monthsSinceSupervisionStart: number
  verifiedRetailNcrMinor: number
  hasDocumentedSupervision: boolean
}): number {
  const { rules, level, monthsSinceSupervisionStart, verifiedRetailNcrMinor } = params
  const cfg = rules.team_lead_override
  assertMinorUnits(verifiedRetailNcrMinor, 'verifiedRetailNcrMinor')
  if (!cfg.enabled) return 0
  if (!params.hasDocumentedSupervision) return 0
  if (level > cfg.maximum_levels || level < 1) return 0
  if (monthsSinceSupervisionStart < 0 || monthsSinceSupervisionStart >= cfg.maximum_months) return 0
  if (verifiedRetailNcrMinor <= 0) return 0 // no payment for recruitment alone
  return applyBps(verifiedRetailNcrMinor, cfg.bps)
}

export type MoneyBreakdownInput = MoneyBreakdown
