# PATREON_WEBHOOKS

Endpoint: `POST /api/patreon-webhook`

## Verification
- Header `X-Patreon-Signature` is an HMAC (MD5) hex digest of the RAW request body using the webhook secret.
- The function verifies against the raw body BEFORE JSON parsing, with a timing-safe comparison. Invalid → 401.

## Idempotency
- Each event derives `external_event_id` = event type + member id + last_charge_date.
- `webhook_events` has UNIQUE (source, external_event_id) — duplicates return `{duplicate: true}` and are not reprocessed.

## Processing
1. Persist raw event (signature_verified = true).
2. For paid member events: hash the email (salted SHA-256), upsert a pending conversion (duplicate-safe on source+transaction id).
3. Reconciliation (daily `patreon-sync-members` + commission finalization) resolves tier → offer mapping, charge status, refunds, and advances the commission lifecycle.

## Lifecycle
estimated → attributed → pending_payment → held (30–45d web / up to 90d iOS) → approved → payable → paid. Refund/chargeback → reversed (negative entry, carry-forward).
