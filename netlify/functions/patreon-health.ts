import { env, isDemoMode, json } from '../lib/env'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

/** patreon-health — integration status for the admin dashboard. */
export default async () => {
  const configured = {
    client_id: Boolean(env('PATREON_CLIENT_ID')),
    client_secret: Boolean(env('PATREON_CLIENT_SECRET')),
    creator_token: Boolean(env('PATREON_CREATOR_ACCESS_TOKEN')),
    campaign_id: Boolean(env('PATREON_CAMPAIGN_ID')),
    webhook_secret: Boolean(env('PATREON_WEBHOOK_SECRET')),
  }
  let lastSync: unknown = null
  if (!isDemoMode() && hasSupabaseConfig()) {
    const { data } = await serviceClient()
      .from('system_settings')
      .select('value')
      .eq('key', 'patreon_last_member_sync')
      .maybeSingle()
    lastSync = data?.value ?? null
  }
  return json({ ok: true, demo_mode: isDemoMode(), configured, last_member_sync: lastSync })
}
