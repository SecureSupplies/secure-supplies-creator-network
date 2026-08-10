/**
 * Money model — ALL monetary values are integer minor units (e.g. cents).
 * Floating-point arithmetic is never used for money.
 * Currency is an ISO 4217 code stored alongside every amount.
 * Currencies are NEVER silently converted.
 */

export type CurrencyCode = string // ISO 4217, e.g. 'USD', 'EUR', 'AUD'

export interface MoneyBreakdown {
  currency: CurrencyCode
  grossAmountMinor: number
  taxAmountMinor: number
  discountAmountMinor: number
  platformFeeMinor: number
  processingFeeMinor: number
  refundAmountMinor: number
  chargebackAmountMinor: number
  fxFeeMinor: number
  payoutFeeMinor: number
}

export class MoneyError extends Error {}

export function assertMinorUnits(value: number, label: string): void {
  if (!Number.isInteger(value)) {
    throw new MoneyError(`${label} must be an integer minor-unit amount, got ${value}`)
  }
  if (!Number.isSafeInteger(value)) {
    throw new MoneyError(`${label} exceeds safe integer range`)
  }
}

export function assertSameCurrency(a: CurrencyCode, b: CurrencyCode): void {
  if (a !== b) {
    throw new MoneyError(
      `Currency mismatch: ${a} vs ${b}. Currencies are never silently converted.`,
    )
  }
}

/**
 * Net Collected Revenue =
 *   cash actually collected (gross)
 *   - indirect tax - discounts - platform fees - processing fees
 *   - refunds - chargebacks - FX costs - allocated payout fees
 * Clamped at zero: NCR is never negative for commission purposes
 * (refund reversal handles clawback separately).
 */
export function netCollectedRevenueMinor(b: MoneyBreakdown): number {
  const fields: Array<[number, string]> = [
    [b.grossAmountMinor, 'grossAmountMinor'],
    [b.taxAmountMinor, 'taxAmountMinor'],
    [b.discountAmountMinor, 'discountAmountMinor'],
    [b.platformFeeMinor, 'platformFeeMinor'],
    [b.processingFeeMinor, 'processingFeeMinor'],
    [b.refundAmountMinor, 'refundAmountMinor'],
    [b.chargebackAmountMinor, 'chargebackAmountMinor'],
    [b.fxFeeMinor, 'fxFeeMinor'],
    [b.payoutFeeMinor, 'payoutFeeMinor'],
  ]
  for (const [v, label] of fields) assertMinorUnits(v, label)
  const ncr =
    b.grossAmountMinor -
    b.taxAmountMinor -
    b.discountAmountMinor -
    b.platformFeeMinor -
    b.processingFeeMinor -
    b.refundAmountMinor -
    b.chargebackAmountMinor -
    b.fxFeeMinor -
    b.payoutFeeMinor
  return Math.max(0, ncr)
}

/**
 * Apply basis points to a minor-unit amount.
 * Uses integer arithmetic; rounds half toward zero-cost (floor) so the
 * program never over-pays by a fractional unit.
 */
export function applyBps(amountMinor: number, bps: number): number {
  assertMinorUnits(amountMinor, 'amountMinor')
  if (!Number.isInteger(bps) || bps < 0 || bps > 10000) {
    throw new MoneyError(`bps must be an integer 0..10000, got ${bps}`)
  }
  return Math.floor((amountMinor * bps) / 10000)
}

/** Format minor units for display. Display-only; never used in calculations. */
export function formatMinor(amountMinor: number, currency: CurrencyCode): string {
  const sign = amountMinor < 0 ? '-' : ''
  const abs = Math.abs(amountMinor)
  const major = Math.floor(abs / 100)
  const minor = String(abs % 100).padStart(2, '0')
  return `${sign}${currency} ${major.toLocaleString('en-US')}.${minor}`
}
