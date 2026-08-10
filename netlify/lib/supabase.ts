import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env, requireEnv } from './env'

/**
 * Service-role client — server functions ONLY.
 * The service-role key bypasses RLS and must never reach the browser.
 */
let cached: SupabaseClient | null = null

export function serviceClient(): SupabaseClient {
  if (cached) return cached
  cached = createClient(requireEnv('VITE_SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cached
}

export function hasSupabaseConfig(): boolean {
  return Boolean(env('VITE_SUPABASE_URL') && env('SUPABASE_SERVICE_ROLE_KEY'))
}

export async function auditLog(entry: {
  actorId?: string
  actorRole?: string
  action: string
  entityTable: string
  entityId?: string
  before?: unknown
  after?: unknown
  reason?: string
}): Promise<void> {
  if (!hasSupabaseConfig()) return
  await serviceClient().from('audit_logs').insert({
    actor_id: entry.actorId ?? null,
    actor_role: entry.actorRole ?? 'system',
    action: entry.action,
    entity_table: entry.entityTable,
    entity_id: entry.entityId ?? null,
    before_state: entry.before ?? null,
    after_state: entry.after ?? null,
    reason: entry.reason ?? null,
  })
}
