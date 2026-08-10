# SUPABASE_SETUP

1. Create a project at https://supabase.com. Note the Project URL and keys (Settings → API).
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (client) and `SUPABASE_SERVICE_ROLE_KEY` (server functions ONLY).
3. Apply migrations in order:
   ```bash
   supabase link --project-ref <ref>
   supabase db push
   ```
   - `0001_core_schema.sql` — roles/enums, profiles, affiliate profiles (one-level override trigger), applications, offers, commission rules, campaigns, assets, rights.
   - `0002_tracking_commerce.sql` — referral links, clicks, identities, discount codes, attributions, webhook events (idempotent), conversions (duplicate-safe), commission entries, submissions, metrics, rewards, payouts, imports, compliance, policies, notifications, immutable audit log, settings.
   - `0003_rls_policies.sql` — RLS on every table; creators see only their own data; token and PII columns revoked from client roles.
4. Seed reference data: `psql "$SUPABASE_DB_URL" -f supabase/seed.sql`.
5. Storage: create buckets `campaign-assets` (private) and `evidence` (private). Serve via signed URLs only.
6. Auth: enable email (magic link). On signup, insert a `profiles` row (trigger or edge function) with default role `creator`.
7. Roles: set `profiles.role` for staff members (`reviewer`, `finance`, `administrator`, `super_admin`) via SQL as super admin.
8. Verify RLS: as an authenticated creator, confirm you cannot select other creators' `commission_entries`, any `patreon_identities` token columns, or `compliance_flags.detail`.
