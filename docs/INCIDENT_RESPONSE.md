# INCIDENT_RESPONSE

## Severity
- SEV1: payouts executing incorrectly, secret exposure, RLS bypass, webhook forgery.
- SEV2: attribution failures, commission miscalculation, import corruption.
- SEV3: UI defects, delayed syncs, provider outages (rendering/publishing).

## Playbooks
**Secret exposure**: rotate the key at the provider (Supabase/Patreon/Netlify) → update Netlify env → redeploy → audit `audit_logs` and provider logs for misuse → notify affected parties per policy.
**Commission miscalculation**: pause payout batch approvals → identify affected rule version → publish corrected rule version → recalculate affected entries via manual adjustments (mandatory reasons; audit-logged) → notify affected creators.
**Webhook failures**: check `/api/patreon-health` and function logs → replay is safe (idempotent) → run `patreon-sync-members` to backfill.
**Fraud spike**: commission hold on affected creators → review flags → enforcement ladder → reverse confirmed-fraud commissions.

## Rules
Never edit `audit_logs`. Never pay out during an open SEV1/SEV2 affecting money. Document every incident with timeline, impact, root cause, and prevention.
