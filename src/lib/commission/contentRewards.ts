/**
 * Content reward calculations.
 * Approved remix:  $5.00 approval bonus + $1.25 / 1,000 qualified views, cap $150 / post.
 * Original UGC:   $20.00 approval bonus + $3.00 / 1,000 qualified views, cap $400 / post.
 * Rewards are never auto-approved from creator-entered view counts; the
 * qualifiedViews input must come from verified metric snapshots.
 */
import { assertMinorUnits } from '../money'
import type { CommissionRuleSet } from './types'
import { DEFAULT_RULES } from './types'

export type ContentType = 'remix' | 'original'

export interface ContentRewardInput {
  contentType: ContentType
  approved: boolean
  /** Verified qualified views (bot/paid/duplicate views already excluded). */
  qualifiedViews: number
  /** Remaining campaign budget in minor units; reward never exceeds it. */
  campaignBudgetRemainingMinor: number
}

export interface ContentRewardResult {
  approvalBonusMinor: number
  viewRewardMinor: number
  cappedTotalMinor: number
  budgetLimited: boolean
  payableMinor: number
}

export function calculateContentReward(
  input: ContentRewardInput,
  rules: CommissionRuleSet = DEFAULT_RULES,
): ContentRewardResult {
  if (!Number.isInteger(input.qualifiedViews) || input.qualifiedViews < 0) {
    throw new Error('qualifiedViews must be a non-negative integer')
  }
  assertMinorUnits(input.campaignBudgetRemainingMinor, 'campaignBudgetRemainingMinor')

  if (!input.approved) {
    return {
      approvalBonusMinor: 0,
      viewRewardMinor: 0,
      cappedTotalMinor: 0,
      budgetLimited: false,
      payableMinor: 0,
    }
  }

  const cfg =
    input.contentType === 'remix' ? rules.content_rewards.remix : rules.content_rewards.original

  const approvalBonusMinor = cfg.approval_bonus_minor
  // Integer arithmetic: views * rate-per-1000 / 1000, floored.
  const viewRewardMinor = Math.floor((input.qualifiedViews * cfg.per_1000_views_minor) / 1000)
  const cappedTotalMinor = Math.min(approvalBonusMinor + viewRewardMinor, cfg.cap_minor)
  const payableMinor = Math.min(cappedTotalMinor, Math.max(0, input.campaignBudgetRemainingMinor))

  return {
    approvalBonusMinor,
    viewRewardMinor,
    cappedTotalMinor,
    budgetLimited: payableMinor < cappedTotalMinor,
    payableMinor,
  }
}
