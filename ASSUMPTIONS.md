# ASSUMPTIONS

Documented assumptions made during the build (no questions were asked; every
unavailable credential or business setting became a configuration variable with
a safe demo-mode default).

1. **Demo mode default.** `DEMO_MODE=true` until explicitly set to `false`. All external
   side effects (payments, publishing, rendering, live webhooks) are mocked with explicit
   `demo_mode: true` responses — never fake successes.
2. **Currency.** Demo offers are USD. The schema stores ISO currency per transaction and
   never converts; multi-currency payout batches are per-currency.
3. **Patreon Shop.** No official Shop-order API/webhook exists, so Shop attribution =
   promo codes + CSV import wizard. Membership discount codes are treated as a feature
   flag because availability varies by account.
4. **Patreon webhook signature.** Verified as HMAC-MD5 of the raw body against
   `PATREON_WEBHOOK_SECRET` (X-Patreon-Signature header), per Patreon's documented scheme.
   Confirm against current docs at deployment time.
5. **Patreon fees.** The illustrative economics use a 10% platform fee + 2.9% + $0.30
   processing. Real reconciliation uses actual amounts from exports/webhooks.
6. **Hold periods.** 30–45 days standard, up to 90 days iOS-related; implemented via
   `hold_release_at` set at commission creation (default 45 days in production config).
7. **Token storage.** OAuth tokens are stored in columns revoked from all client roles;
   production should additionally encrypt with a KMS before insert (adapter point marked
   in `patreon-oauth-callback.ts`).
8. **Team Lead override** ships disabled. Enabling requires: legal review, documented
   supervision records, and flipping `team_lead_override.enabled` in a new commission-rule
   version. Engine hard-codes: one level max, 6 months max, retail-NCR-only.
9. **Auth roles in demo.** The static demo uses a client-side role switcher instead of
   Supabase Auth. Production role enforcement is RLS-based (migration 0003).
10. **Rendering/publishing providers.** Creatomate/Shotstack and Ayrshare adapters are
    implemented behind interfaces; without keys they return explicit not-configured
    responses. Browser FFmpeg was deliberately left out of the demo bundle to keep the
    app independent of FFmpeg loading successfully (documented optional enhancement).
11. **Minimum payout** $50 (5000 minor units), monthly batches, manual confirmation in MVP.
12. **Billing migration.** Any legacy Patreon subscription-billing configuration must be
    verified before the November 1, 2026 deadline — flagged in PATREON_SETUP.md; not
    automatable from this codebase.
