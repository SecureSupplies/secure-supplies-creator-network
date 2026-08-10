# ADMIN_GUIDE

## Daily
- **Dashboard**: NCR, commission/reward expense, refund rate (<5% target), fraud flags, creator concentration.
- **Applications**: approve/reject; approval creates the affiliate profile + partner code.
- **Submissions**: review queue with 100-point scoring; approve, request changes, or reject. Approval enables content rewards.
- **Fraud**: review click bursts, impossible conversion rates, duplicate URLs/transactions, refund patterns, suspicious view growth. Thresholds are staff-only.

## Weekly
- **Imports**: upload Patreon sales exports (wizard: upload → map → preview → import). Map new promo codes first.
- **Metrics verification**: verify creator-submitted analytics before rewards calculate.
- **Compliance queue**: work the ladder — education → correction → removal → campaign suspension → commission hold → program suspension → termination.

## Monthly
- **Finalize commissions** (also runs daily on schedule) → **create payout batch** (per currency; $50 minimum; negative balances carry) → review → approve → export CSV → pay → mark paid with payment references.
- Review campaign budgets — campaigns never continue automatically past a depleted budget.

## Guardrails you cannot bypass
- Manual adjustments REQUIRE a reason and are audit-logged (immutable log).
- The Team Lead override is feature-flagged off; enabling requires a new commission-rule version and legal review — and even then never pays on recruitment alone.
- Demo mode never executes payments, publishing, or rendering.
