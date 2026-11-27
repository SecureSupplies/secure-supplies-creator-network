# Secure Supplies Creator Partner Network

**Portal:** Creator Command Center · **Tagline:** Learn. Build. Publish. Refer. Earn.
**Business:** Donatelli LLC d/b/a Secure Supplies Group · **Founder:** Daniel Donatelli
**Existing Patreon:** https://www.patreon.com/c/securesupplies

A production-grade creator-partner platform: campaign marketplace, asset vault, remix studio,
referral tracking, Patreon attribution, versioned commission engine, content rewards,
compliance workflow, and payout administration.

## Program principles (enforced in code)

- **No commission for recruiting.** The engine has no recruitment payment path; the Team Lead
  override is feature-flagged OFF, one level maximum, six months maximum, and pays only on
  verified retail Net Collected Revenue.
- **No self-referral commissions.** Flagged in attribution, zeroed in the engine.
- **All money is integer minor units.** Floating-point money throws (`MoneyError`).
- **Refunds and chargebacks reverse commissions**, with partial-refund proration and
  negative-balance carry-forward.
- **Earnings are never guaranteed** — copy across the site says so.
- **Every post carries the required affiliate disclosure** — submission requires confirmation,
  and captions are scanned for prohibited claims.

## Quick start

```bash
npm install
npm run dev        # local dev server (demo mode, mock data)
npm run test       # unit tests (commission engine, rewards, attribution)
npm run build      # type-check + production build
npm run verify     # typecheck + lint + tests + build
npm run test:e2e   # smoke test against a built preview (requires Chromium)
```

## Structure

```
src/lib/            Money model, commission engine, attribution, compliance (unit-tested)
src/pages/          Public site, Creator portal (13 routes), Admin portal (18 routes)
src/demo/           Deterministic FICTIONAL demo dataset + role switcher
netlify/functions/  21 serverless functions (Patreon, tracking, commissions, payouts)
netlify/lib/        Server-only helpers (service-role client, Patreon HMAC, OAuth state)
supabase/migrations 3 migrations: schema, commerce, RLS
supabase/seed.sql   Seed offers/campaigns/rules
templates/          Blank CSV import templates
docs/               Deployment, Patreon setup, commission engine, guides, policies
```

## Demo vs production

`DEMO_MODE=true` (default) serves the full UI with fictional data and mocks every external
side effect (payments, publishing, rendering, webhooks) with explicit "demo" responses.
Production requires Supabase + Patreon configuration — see `docs/DEPLOY_NETLIFY.md` and
`docs/PATREON_SETUP.md`.

**Patreon Shop limitation:** Patreon's public API v2 has no Shop-order endpoint or webhook.
Shop attribution is implemented via creator promo codes + CSV sales imports
(`docs/PATREON_SALES_IMPORT.md`). This system does not invent unsupported APIs.

## License & legal

Policy pages and agreement templates are drafts for counsel review — not legal advice.
© 2026 Daniel Donatelli / Donatelli LLC d/b/a Secure Supplies Group. All rights reserved.
