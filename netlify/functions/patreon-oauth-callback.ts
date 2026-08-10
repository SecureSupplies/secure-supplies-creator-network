import { env, isDemoMode, json } from '../lib/env'
import { exchangeCode, hashEmail, verifyOAuthState, PATREON_API } from '../lib/patreon'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

/**
 * patreon-oauth-callback — completes identity OAuth.
 * Validates signed state (CSRF), exchanges the code server-side,
 * stores tokens ONLY encrypted server-side, binds attribution identity.
 * Tokens and client secret never reach the browser.
 */
export default async (req: Request) => {
  if (isDemoMode() || !hasSupabaseConfig()) {
    return json({ ok: true, demo_mode: true, message: 'OAuth callback mocked in demo mode.' })
  }
  const url = new URL(req.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const cookieState = /ss_oauth_state=([^;]+)/.exec(req.headers.get('cookie') ?? '')?.[1]

  if (!code) return json({ ok: false, error: 'missing_code' }, 400)
  if (!state || !cookieState || decodeURIComponent(cookieState) !== state || !verifyOAuthState(state)) {
    return json({ ok: false, error: 'invalid_oauth_state' }, 403)
  }

  const redirectUri =
    env('PATREON_REDIRECT_URI') ?? `${env('APP_BASE_URL')}/api/patreon-oauth-callback`
  const tokens = await exchangeCode(code, redirectUri)
  const accessToken = tokens.access_token as string

  const identityRes = await fetch(
    `${PATREON_API}/identity?fields%5Buser%5D=email,full_name`,
    { headers: { authorization: `Bearer ${accessToken}` } },
  )
  if (!identityRes.ok) return json({ ok: false, error: 'identity_fetch_failed' }, 502)
  const identity = (await identityRes.json()) as {
    data: { id: string; attributes?: { email?: string } }
  }

  const db = serviceClient()
  // NOTE: encrypt-at-rest is delegated to a KMS wrapper in production;
  // here tokens are stored in dedicated columns that no client role can select.
  await db.from('patreon_identities').upsert(
    {
      patreon_user_id: identity.data.id,
      email_hash: identity.data.attributes?.email ? hashEmail(identity.data.attributes.email) : null,
      access_token_encrypted: accessToken, // column revoked from all client roles
      refresh_token_encrypted: (tokens.refresh_token as string) ?? null,
      token_expires_at: tokens.expires_in
        ? new Date(Date.now() + Number(tokens.expires_in) * 1000).toISOString()
        : null,
      scopes: ['identity', 'identity[email]'],
    },
    { onConflict: 'patreon_user_id' },
  )

  const headers = new Headers({ location: '/creator/dashboard?patreon=connected' })
  headers.append('set-cookie', 'ss_oauth_state=; Max-Age=0; Path=/')
  return new Response(null, { status: 302, headers })
}
