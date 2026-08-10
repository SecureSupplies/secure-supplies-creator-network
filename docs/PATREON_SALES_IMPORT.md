# PATREON_SALES_IMPORT

Because Patreon has no Shop-order API/webhook, Shop and one-time product sales are reconciled by CSV import.

## Workflow (Admin → Imports)
1. **Upload** the Patreon sales/Shop export CSV (or use `templates/sales-import-template.csv`).
2. **Map columns** — the wizard tolerates changing export headers; mappings can be saved as reusable templates (e.g. "Patreon Shop 2026-07"). Amounts given in major units are converted to integer minor units on import.
3. **Preview & validate** — row-level validation, duplicate transaction-ID detection (unique source+transaction id), unknown product slugs reported in a downloadable error report.
4. **Import** — valid rows create conversions; redeemed promo codes resolve to creator attributions; refunded rows create/trigger commission reversals.

## Refunds
Import refund rows via `templates/refund-adjustment-template.csv` (or re-import the updated sales export). Refunds prorate commission reversals; chargebacks reverse fully.

## Attribution priority (applies at import)
1. Redeemed creator promo code → 2. authenticated Patreon identity → 3. most recent eligible click ≤ 30 days → 4. approved manual claim (≤ 7 days) → 5. organic (no commission).
