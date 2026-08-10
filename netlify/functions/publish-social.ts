import { z } from 'zod'
import { env, isDemoMode, json } from '../lib/env'

/**
 * publish-social — Ayrshare-style unified publishing adapter.
 *
 * Hard rules:
 *  - NEVER publishes without the creator's explicit approval flag.
 *  - Creators connect and authorize their OWN social accounts;
 *    "one click to every platform" is impossible without those grants.
 *  - Demo mode / missing key returns MVP instructions (manual posting).
 */
const bodySchema = z.object({
  submissionDraftId: z.string(),
  platforms: z.array(z.enum(['youtube', 'tiktok', 'instagram', 'facebook', 'x', 'linkedin', 'pinterest'])).min(1),
  caption: z.string().max(5000),
  mediaUrl: z.string().url().optional(),
  creatorApproved: z.literal(true), // publishing requires explicit approval
  scheduleAt: z.string().optional(),
})

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return json(
      { ok: false, error: 'validation_failed_or_missing_creator_approval', issues: parsed.error.issues },
      400,
    )
  }

  const apiKey = env('AYRSHARE_API_KEY')
  if (isDemoMode() || !apiKey) {
    return json({
      ok: true,
      demo_mode: true,
      mode: 'mvp_manual',
      message:
        'Connected publishing is not configured. MVP flow: download the rendered video, copy the ' +
        'caption + disclosure + affiliate link, open the platform composer, post manually, then ' +
        'submit the live URL in the Creator Command Center.',
    })
  }

  const res = await fetch('https://api.ayrshare.com/api/post', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      post: parsed.data.caption,
      platforms: parsed.data.platforms,
      mediaUrls: parsed.data.mediaUrl ? [parsed.data.mediaUrl] : undefined,
      scheduleDate: parsed.data.scheduleAt,
    }),
  })
  if (!res.ok) return json({ ok: false, error: `publish_failed_${res.status}` }, 502)
  const data = (await res.json()) as Record<string, unknown>
  return json({ ok: true, provider: 'ayrshare', providerResponse: data })
}
