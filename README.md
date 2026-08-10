# Secure Supplies Creator Partner Network

Live: https://delicate-tarsier-7e742c.netlify.app

Business: Donatelli LLC d/b/a Secure Supplies Group · Owner: Daniel Donatelli

Patreon: https://www.patreon.com/cw/securesupplies

A production creator-affiliate platform. Creators apply, get personal tracked links and Patreon promo codes, remix licensed assets, share on social platforms, and earn retail commissions on verified Patreon memberships and product sales. No recruitment payments exist anywhere in this system — retail sales only, enforced in code (FTC-compliant by design).

## Stack

- Frontend: Vite + React SPA (public site, Creator portal, Admin portal)
- Serverless: 25+ Netlify Functions (tracking, commissions, Patreon OAuth/webhooks, payouts) + 2 scheduled jobs (nightly member sync, commission finalization)
- Database/Auth: Supabase Postgres — 31 tables, 57 RLS policies, magic-link email login (no passwords)
- Sales sources: Patreon memberships (API v2 webhook) · Patreon Shop (CSV import + promo-code attribution — Patreon has no Shop API)

## Commission model

25% first month · 15% renewals (2–12) · 20% annual · 25% products · 30% launch cap — computed on Net Collected Revenue (integer minor units; refunds and chargebacks auto-reverse). Content rewards: remix $5 + $1.25/1k verified views (cap $150); original $20 + $3/1k (cap $400). $50 payout minimum, monthly batches, 30–45 day holds (up to 90 iOS).

## Deployment

- Netlify builds from this repo (main); settings in netlify.toml (build npm run build, publish dist, functions netlify/functions).
- All secrets live in Netlify environment variables — never in this repo. .env.example documents required keys with empty values.
- Database schema: supabase/migrations/ (3 files, run in order) + supabase/seed.sql.
- Full guides in docs/: deployment, Patreon setup, commission engine, admin & creator guides, security, testing.

## Development

```bash
npm install
npm run dev      # local dev (demo mode, mock data)
npm run verify   # typecheck + lint + 38 unit tests + build
```

## License

Proprietary. © Donatelli LLC d/b/a Secure Supplies Group. All rights reserved. No use, copying, or distribution without written permission.
