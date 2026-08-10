import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

/**
 * finalize-commissions — moves commissions through the lifecycle:
 *   estimated → attributed → pending_payment → held → approved → payable
 * Hold periods: 30–45 days standard web, up to 90 days for iOS-related
 * transactions. Runs daily via scheduled-commission-finalize.
 */
export default async () => {
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Commission finalization')
  const db = serviceClient()
  const now = new Date().toISOString()

  const { data: released, error } = await db
    .from('commission_entries')
    .update({ status: 'payable' })
    .eq('status', 'held')
    .lte('hold_release_at', now)
    .select('id')
  if (error) return json({ ok: false, error: error.message }, 500)

  await auditLog({
    action: 'finalize_commissions',
    entityTable: 'commission_entries',
    reason: `${released?.length ?? 0} entries released to payable`,
  })
  return json({ ok: true, released: released?.length ?? 0 })
}
