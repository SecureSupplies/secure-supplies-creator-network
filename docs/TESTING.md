# TESTING

## Unit tests (`npm run test`) — Vitest, 38 tests
Covering: NCR computation and clamping; float-money rejection; bps math and floor rounding; first/renewal/annual membership rates; post-month-12 zero + campaign override; product 25%; launch 30% cap; high-touch first-payment-only; self-referral zero; organic zero; determinism/idempotency; currency separation; full/partial refund proration; chargeback full reversal; content-reward CPM, caps, and budget cap; unapproved = zero; Team Lead override disabled / one-level / no-recruitment / six-month / supervision-required; attribution priority (code > identity > click > manual > organic), 30-day window, self-referral flag.

## E2E smoke (`npm run test:e2e`)
Builds, serves the dist, and drives Chromium through: landing renders (DEMO DATA banner) → apply form submits → role switch to Creator → campaign selected → link copied view → earnings ledger renders commission rows → submissions list → role switch to Admin → review queue, conversions, commissions, payout batches render. Uses playwright-core with a system Chromium (set `CHROMIUM_PATH` if needed).

## Verification gate (`npm run verify`)
typecheck (app + functions strict TS) → oxlint → unit tests → production build. CI should run `npm run verify` on every push.

## Production integration checks
`/api/health`, `/api/patreon-health`; webhook signature negative test (bad signature → 401); duplicate webhook → `duplicate: true`; duplicate sales import row → skipped.
