/**
 * Server-side environment access.
 * Secrets (service-role key, Patreon client secret, tokens, webhook secret)
 * live ONLY here — they are never bundled into client code and never
 * returned in any response body.
 */

export function env(name: string): string | undefined {
  return process.env[name]
}

export function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Missing required environment variable: ${name}`)
  return v
}

export function isDemoMode(): boolean {
  return (process.env.DEMO_MODE ?? 'true').toLowerCase() !== 'false'
}

export function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

export function demoUnavailable(feature: string): Response {
  return json(
    {
      ok: false,
      demo_mode: true,
      message: `${feature} is not executed in demo mode. Configure credentials and set DEMO_MODE=false for production behaviour.`,
    },
    501,
  )
}

/** Simple fixed-window rate limiter (per function instance). */
const windowCounts = new Map<string, { count: number; resetAt: number }>()
export function rateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now()
  const entry = windowCounts.get(key)
  if (!entry || entry.resetAt < now) {
    windowCounts.set(key, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count += 1
  return entry.count <= maxPerMinute
}
