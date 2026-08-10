# SECURITY

## Secrets
- All secrets live in Netlify environment variables. Nothing secret is in source control (`.env` is gitignored; `.env.example` contains empty placeholders only).
- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — used ONLY inside `netlify/lib/supabase.ts` (server functions). It must never appear in `src/` or any `VITE_`-prefixed variable.
- Patreon client secret, creator tokens, and webhook secret are server-only. OAuth tokens are stored in DB columns revoked from all client roles; add KMS encryption before insert in production (marked in `patreon-oauth-callback.ts`).

## Request security
- Patreon webhooks: HMAC signature verified against the RAW request body (timing-safe compare) before any parsing; idempotency enforced by unique (source, external_event_id).
- OAuth: signed state parameter + state cookie (CSRF protection); tokens exchanged server-side only.
- Referral endpoints: input validation (partner code and slug regexes), per-IP rate limiting; creator application uses CAPTCHA in production (adapter point on /apply).
- Click IDs are HMAC-signed; no invasive device fingerprinting is performed.

## Data protection
- Customer emails are stored ONLY as salted SHA-256 hashes (`EMAIL_HASH_SALT`) for attribution matching.
- `conversions.customer_ref_hash` is column-revoked from creator roles; raw customer PII never reaches creators.
- `compliance_flags.detail` (fraud logic) is column-revoked from creators.
- Asset delivery uses signed, expiring Supabase Storage URLs.
- `audit_logs` is insert-only (update/delete revoked) — an immutable administrative trail.

## Money
- Integer minor units everywhere; floating-point money throws. Currencies are never silently converted.

## Reporting
Report suspected vulnerabilities privately to the program administrator; do not open public issues containing exploit details.
