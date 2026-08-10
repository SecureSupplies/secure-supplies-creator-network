# PATREON_SETUP

## 1. Create the API client
1. Log in as the Secure Supplies Patreon creator account.
2. Go to https://www.patreon.com/portal/registration/register-clients and create an **API v2** client.
3. Record: Client ID, Client Secret, Creator Access Token, Creator Refresh Token.
4. Add them as server-side env vars: `PATREON_CLIENT_ID`, `PATREON_CLIENT_SECRET`, `PATREON_CREATOR_ACCESS_TOKEN`, `PATREON_CREATOR_REFRESH_TOKEN`. Never expose these in client code or logs.

## 2. Configure OAuth
- Redirect/callback URI: `https://<your-domain>/api/patreon-oauth-callback` — set it identically in the Patreon client config and `PATREON_REDIRECT_URI`.
- Scopes used for supporter identity binding: `identity identity[email]`.
- Test: visit `/api/patreon-oauth-start` while logged into a test Patreon account; you should land back on the creator dashboard with `?patreon=connected`. The flow validates a signed state cookie (CSRF) and stores tokens server-side only.

## 3. Campaign ID
Fetch your campaign id once (creator token): `GET https://www.patreon.com/api/oauth2/v2/campaigns` → set `PATREON_CAMPAIGN_ID`.

## 4. Webhook
1. Create a webhook pointing to `https://<your-domain>/api/patreon-webhook` for member events (members:create, members:update, members:delete / pledge events).
2. Set the webhook secret as `PATREON_WEBHOOK_SECRET`.
3. Test signature verification: send a test event; an invalid signature must return 401, a valid one 200, and a re-delivered event must return `duplicate: true` (idempotency).

## 5. Initial member sync
Run `POST /api/patreon-sync-members` (admin) or wait for the daily scheduled run. Check `/api/patreon-health` for `last_member_sync`.

## 6. Shop sales and promo codes
There is NO official Patreon Shop-order API or webhook. Workflow:
1. Create a distinct Patreon promotional code per creator (or per creator+campaign).
2. Map codes via the admin Discount Codes screen (or `POST /api/map-discount-code`).
3. Periodically export Sales/Shop data from Patreon and import via Admin → Imports (see `PATREON_SALES_IMPORT.md`).
4. Verify a test commission end-to-end: import a test row with a mapped code → conversion created → commission entry calculated at the configured rate → refund import reverses it.

Membership discount codes are feature-flagged: Patreon membership discounts may not be available on every account — verify on yours before enabling.

## 7. Billing migration
If any legacy subscription-billing configuration remains on the account, confirm it is fully migrated to Patreon's required billing model **before November 1, 2026**.

## 8. Fees & timing notes
Web/Android transactions may stay pending for several days; iOS transactions can pend substantially longer and carry Apple-related fees — which is why iOS-related commissions use up to a 90-day hold.
