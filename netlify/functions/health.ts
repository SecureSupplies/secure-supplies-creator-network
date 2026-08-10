import { env, isDemoMode, json } from '../lib/env'
import { hasSupabaseConfig } from '../lib/supabase'

/** health — liveness and configuration summary (no secret values). */
export default async () =>
  json({
    ok: true,
    service: 'secure-supplies-creator-network',
    demo_mode: isDemoMode(),
    configured: {
      supabase: hasSupabaseConfig(),
      patreon: Boolean(env('PATREON_CLIENT_ID')),
      media_render: (env('MEDIA_RENDER_PROVIDER') ?? 'none') !== 'none',
      social_publish: Boolean(env('AYRSHARE_API_KEY')),
    },
    timestamp: new Date().toISOString(),
  })
