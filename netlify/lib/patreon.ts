import { createHmac, timingSafeEqual, createHash, randomBytes } from 'node:crypto'
import { env, requireEnv } from './env'

export const PATREON_API = 'https://www.patreon.com/api/oauth2/v2'
export const PATREON_AUTH_URL = 'https://www.patreon.com/oauth2/authorize'
export const PATREON_TOKEN_URL = 'https://www.patreon.com/api/oauth2/token'

/**
 * Verify Patreon's webhook signature.
 * Patreon signs the RAW request body with HMAC-MD5 using the webhook secret
 * and sends the hex digest in the X-Patreon-Signature header.
 * Verification MUST use the raw body bytes, before any JSON parsing.
 */
export function verifyPatreonSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false
  const secret = env('PATREON_WEBHOOK_SECRET')
  if (!secret) return false
  const expected = createHmac('md5', secret).update(rawBody, 'utf8').digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(signatureHeader.trim().toLowerCase(), 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

/** Hash an email for attribution matching. Raw emails are never stored. */
export function hashEmail(email: string): string {
  const salt = env('EMAIL_HASH_SALT') ?? 'dev-only-salt'
  return createHash('sha256').update(`${salt}:${email.trim().toLowerCase()}`).digest('hex')
}

/** Signed OAuth state to prevent CSRF. */
export function createOAuthState(): { state: string; signed: string } {
  const state = randomBytes(16).toString('hex')
  const sig = createHmac('sha256', requireEnv('TOKEN_ENCRYPTION_KEY')).update(state).digest('hex')
  return { state, signed: `${state}.${sig}` }
}

export function verifyOAuthState(signed: string | null): boolean {
  if (!signed) return false
  const [state, sig] = signed.split('.')
  if (!state || !sig) return false
  const expected = createHmac('sha256', requireEnv('TOKEN_ENCRYPTION_KEY'))
    .update(state)
    .digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(sig)
  return a.length === b.length && timingSafeEqual(a, b)
}

export function oauthAuthorizeUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: requireEnv('PATREON_CLIENT_ID'),
    redirect_uri: redirectUri,
    scope: 'identity identity[email]',
    state,
  })
  return `${PATREON_AUTH_URL}?${params.toString()}`
}

export async function exchangeCode(code: string, redirectUri: string): Promise<Record<string, unknown>> {
  const res = await fetch(PATREON_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      grant_type: 'authorization_code',
      client_id: requireEnv('PATREON_CLIENT_ID'),
      client_secret: requireEnv('PATREON_CLIENT_SECRET'),
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) throw new Error(`Patreon token exchange failed: ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

export async function refreshToken(refreshTokenValue: string): Promise<Record<string, unknown>> {
  const res = await fetch(PATREON_TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshTokenValue,
      client_id: requireEnv('PATREON_CLIENT_ID'),
      client_secret: requireEnv('PATREON_CLIENT_SECRET'),
    }),
  })
  if (!res.ok) throw new Error(`Patreon token refresh failed: ${res.status}`)
  return (await res.json()) as Record<string, unknown>
}

/**
 * Fetch campaign members (paginated) from Patreon API v2.
 * NOTE: There is NO official Patreon Shop-order API or webhook.
 * Shop attribution uses promo codes + CSV sales imports instead.
 */
export async function fetchCampaignMembers(accessToken: string, campaignId: string, cursor?: string) {
  const fields = new URLSearchParams({
    'fields[member]':
      'patron_status,last_charge_status,last_charge_date,currently_entitled_amount_cents,email',
    'page[count]': '100',
  })
  if (cursor) fields.set('page[cursor]', cursor)
  const url = `${PATREON_API}/campaigns/${campaignId}/members?${fields.toString()}`
  const res = await fetch(url, { headers: { authorization: `Bearer ${accessToken}` } })
  if (!res.ok) throw new Error(`Patreon members fetch failed: ${res.status}`)
  return (await res.json()) as { data: unknown[]; meta?: { pagination?: { cursors?: { next?: string } } } }
}
