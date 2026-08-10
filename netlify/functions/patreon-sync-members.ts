import { env, isDemoMode, json, demoUnavailable } from '../lib/env'
import { fetchCampaignMembers } from '../lib/patreon'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

/**
 * patreon-sync-members — reconciles Patreon campaign members:
 * tier, charge status, last charge date, entitlement, patron status.
 * Run daily via scheduled-member-sync, or manually by an administrator.
 */
export default async () => {
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Patreon member sync')

  const accessToken = env('PATREON_CREATOR_ACCESS_TOKEN')
  const campaignId = env('PATREON_CAMPAIGN_ID')
  if (!accessToken || !campaignId) {
    return json({ ok: false, error: 'missing_patreon_credentials' }, 500)
  }

  let cursor: string | undefined
  let synced = 0
  const db = serviceClient()
  do {
    const page = await fetchCampaignMembers(accessToken, campaignId, cursor)
    for (const raw of page.data) {
      const member = raw as { id: string; attributes: Record<string, unknown> }
      await db.from('webhook_events').upsert(
        {
          source: 'patreon',
          event_type: 'sync:member',
          external_event_id: `sync:${member.id}:${String(member.attributes.last_charge_date ?? '')}`,
          signature_verified: true,
          raw_payload: member as unknown as Record<string, unknown>,
          processed_at: new Date().toISOString(),
        },
        { onConflict: 'source,external_event_id', ignoreDuplicates: true },
      )
      synced += 1
    }
    cursor = page.meta?.pagination?.cursors?.next
  } while (cursor)

  await db.from('system_settings').upsert(
    { key: 'patreon_last_member_sync', value: { at: new Date().toISOString(), synced } },
    { onConflict: 'key' },
  )
  await auditLog({ action: 'patreon_member_sync', entityTable: 'webhook_events', reason: `${synced} members` })
  return json({ ok: true, synced })
}
