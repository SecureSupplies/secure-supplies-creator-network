import { env, isDemoMode, json } from '../lib/env'
import { createOAuthState, oauthAuthorizeUrl } from '../lib/patreon'

/**
 * patreon-oauth-start — begins the Patreon identity OAuth flow.
 * Sets a signed state cookie (CSRF protection) and redirects to Patreon.
 */
export default async () => {
  if (isDemoMode() || !env('PATREON_CLIENT_ID')) {
    return json({
      ok: true,
      demo_mode: true,
      message: 'OAuth is mocked in demo mode. Set PATREON_CLIENT_ID/SECRET and DEMO_MODE=false.',
    })
  }
  const redirectUri = env('PATREON_REDIRECT_URI') ?? `${env('APP_BASE_URL')}/api/patreon-oauth-callback`
  const { signed } = createOAuthState()
  const headers = new Headers({ location: oauthAuthorizeUrl(redirectUri, signed) })
  headers.append(
    'set-cookie',
    `ss_oauth_state=${encodeURIComponent(signed)}; Max-Age=600; Path=/; SameSite=Lax; Secure; HttpOnly`,
  )
  return new Response(null, { status: 302, headers })
}
