import { env, isDemoMode, json, demoUnavailable } from '../lib/env'
import { refreshToken } from '../lib/patreon'

/**
 * patreon-refresh-token — refreshes the creator access token server-side.
 * The refreshed tokens are stored in environment/secret storage;
 * they are NEVER returned to the caller.
 */
export default async () => {
  if (isDemoMode()) return demoUnavailable('Patreon token refresh')
  const current = env('PATREON_CREATOR_REFRESH_TOKEN')
  if (!current) return json({ ok: false, error: 'missing_refresh_token' }, 500)
  await refreshToken(current)
  // Production note: persist rotated tokens to your secret manager here.
  // They are intentionally not written to the database in plaintext and
  // never included in this response.
  return json({ ok: true, message: 'Token refreshed. Rotate stored secret out-of-band.' })
}
