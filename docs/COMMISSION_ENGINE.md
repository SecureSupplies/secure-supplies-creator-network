# COMMISSION_ENGINE

Code: `src/lib/money.ts`, `src/lib/commission/engine.ts`, `src/lib/commission/types.ts`. Fully unit-tested (`engine.test.ts`).

## Money model
Integer minor units only; floating point throws `MoneyError`. Stored fields per transaction: gross, tax, discount, platform fee, processing fee, refund, chargeback, FX fee, payout fee — plus ISO currency. Currencies are never silently converted.

**Net Collected Revenue (NCR)** = gross − tax − discounts − platform fees − processing fees − refunds − chargebacks − FX − allocated payout fees (clamped ≥ 0).

## Rates (rule version 1, configurable per product & campaign — never hard-coded in pages)
| Category | Rate |
|---|---|
| Monthly membership, payment 1 | 25% of NCR |
| Renewals, payments 2–12 | 15% |
| After payment 12 | 0 unless campaign override |
| Annual membership | 20% |
| Digital products | 25% |
| Launch campaigns | up to 30% (hard cap) |
| High-touch | 10–15%, first payment only |
| Free membership / organic / self-referral | 0 |

Basis points integer math with floor rounding (never over-pays a fractional unit). Every entry stores the rule version used.

## Worked example (matches unit test)
$49.00 membership, 10% platform fee, 2.9%+$0.30 processing → NCR $42.38 → first-month commission $10.59; renewal $6.35.

## Reversals
- Full refund → full reversal. Partial refund → prorated by refunded/NCR fraction. Chargeback → always full reversal.
- Reversal entries are negative; creator balances can go negative and carry forward into future payout periods.

## Certified Team Lead override (DISABLED)
Feature flag off by default. Even when enabled the engine hard-enforces: one level max, six months max from documented supervision start, documented supervision required, and **zero payment when the trained creator has no verified retail NCR** — no recruitment payment path exists in the codebase.

## Content rewards (`contentRewards.ts`)
Remix: $5 + $1.25/1,000 qualified views, cap $150/post. Original: $20 + $3.00/1,000, cap $400/post. Never exceeds remaining campaign budget; settles after a 30-day observation window; requires admin-verified views.
