import { z } from 'zod'
import { env, isDemoMode, json } from '../lib/env'

/**
 * render-media — provider adapter for Creatomate / Shotstack.
 * Provider is selected by MEDIA_RENDER_PROVIDER.
 * With no provider key, demo mode returns an explicit mock response —
 * it never fakes a successful production render.
 */
const bodySchema = z.object({
  assetId: z.string(),
  trimStartSeconds: z.number().min(0),
  trimEndSeconds: z.number().min(0),
  aspectRatio: z.enum(['9:16', '1:1', '16:9']),
  subtitleLanguage: z.string().optional(),
  hookText: z.string().max(200).optional(),
  disclosureOverlay: z.boolean().default(true),
  ctaText: z.string().max(200).optional(),
})

interface RenderProvider {
  name: string
  submit(job: z.infer<typeof bodySchema>): Promise<{ renderId: string; status: string }>
}

function creatomateProvider(apiKey: string): RenderProvider {
  return {
    name: 'creatomate',
    async submit(job) {
      const res = await fetch('https://api.creatomate.com/v1/renders', {
        method: 'POST',
        headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
        body: JSON.stringify({
          template_id: env('CREATOMATE_TEMPLATE_ID'),
          modifications: {
            trim_start: job.trimStartSeconds,
            trim_end: job.trimEndSeconds,
            aspect_ratio: job.aspectRatio,
            hook: job.hookText ?? '',
            cta: job.ctaText ?? '',
          },
        }),
      })
      if (!res.ok) throw new Error(`Creatomate render failed: ${res.status}`)
      const data = (await res.json()) as Array<{ id: string; status: string }>
      return { renderId: data[0]?.id ?? 'unknown', status: data[0]?.status ?? 'queued' }
    },
  }
}

function shotstackProvider(apiKey: string): RenderProvider {
  return {
    name: 'shotstack',
    async submit(job) {
      const res = await fetch('https://api.shotstack.io/edit/v1/render', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'content-type': 'application/json' },
        body: JSON.stringify({
          timeline: { tracks: [] },
          output: {
            format: 'mp4',
            aspectRatio: job.aspectRatio === '9:16' ? '9:16' : job.aspectRatio,
          },
        }),
      })
      if (!res.ok) throw new Error(`Shotstack render failed: ${res.status}`)
      const data = (await res.json()) as { response?: { id?: string } }
      return { renderId: data.response?.id ?? 'unknown', status: 'queued' }
    },
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)

  const providerName = env('MEDIA_RENDER_PROVIDER') ?? 'none'
  const creatomateKey = env('CREATOMATE_API_KEY')
  const shotstackKey = env('SHOTSTACK_API_KEY')

  if (isDemoMode() || providerName === 'none' || (!creatomateKey && !shotstackKey)) {
    return json({
      ok: true,
      demo_mode: true,
      status: 'mock',
      message:
        'Cloud rendering is NOT configured. This is a mock response — no video was produced. ' +
        'Set MEDIA_RENDER_PROVIDER plus CREATOMATE_API_KEY or SHOTSTACK_API_KEY, and DEMO_MODE=false. ' +
        'Creators can still download the campaign package for local editing.',
    })
  }

  const provider: RenderProvider =
    providerName === 'shotstack' && shotstackKey
      ? shotstackProvider(shotstackKey)
      : creatomateProvider(creatomateKey ?? '')
  try {
    const result = await provider.submit(parsed.data)
    return json({ ok: true, provider: provider.name, ...result })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 502)
  }
}
