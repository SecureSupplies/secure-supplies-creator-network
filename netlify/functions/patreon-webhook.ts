import { json, isDemoMode } from '../lib/env'
import { verifyPatreonSignature, hashEmail } from '../lib/patreon'
import { hasSupabaseConfig, serviceClient } from '../lib/supabase'

/**
 * patreon-webhook — receives members:create / members:update /
 * members:delete and pledge events from Patreon.
 *
 * Security:
 *  - HMAC signature verified against the RAW body before parsing.
 *  - Idempotent: duplicate events (same source + event id) are ignored.
 */
export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)

  const rawBody = await req.text()
  const signature = req.headers.get('x-patreon-signature')
  const eventType = req.headers.get('x-patreon-event') ?? 'unknown'

  if (isDemoMode() || !hasSupabaseConfig()) {
    return json({ ok: true, demo_mode: true, message: 'Webhook accepted (demo mode, not persisted).' })
  }

  if (!verifyPatreonSignature(rawBody, signature)) {
    return json({ ok: false, error: 'invalid_signature' }, 401)
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400)
  }

  const data = payload.data as { id?: string; attributes?: Record<string, unknown> } | undefined
  const externalEventId = `${eventType}:${data?.id ?? 'unknown'}:${String(
    (data?.attributes?.last_charge_date as string) ?? '',
  )}`

  const db = serviceClient()

  // Idempotency: unique (source, external_event_id)
  const { error: insertError } = await db.from('webhook_events').insert({
    source: 'patreon',
    event_type: eventType,
    external_event_id: externalEventId,
    signature_verified: true,
    raw_payload: payload,
  })
  if (insertError) {
    if (insertError.code === '23505') {
      return json({ ok: true, duplicate: true, message: 'Event already processed.' })
    }
    return json({ ok: false, error: 'persist_failed' }, 500)
  }

  // Build a pending conversion record for member payment events.
  const attrs = data?.attributes ?? {}
  const email = attrs.email as string | undefined
  const chargeStatus = attrs.last_charge_status as string | undefined
  const entitledCents = attrs.currently_entitled_amount_cents as number | undefined

  if (chargeStatus === 'Paid' && typeof entitledCents === 'number' && data?.id) {
    // Match pending attribution by Patreon user id or email hash.
    const emailHash = email ? hashEmail(email) : null
    await db.from('conversions').upsert(
      {
        external_transaction_id: externalEventId,
        source: 'patreon_membership',
        offer_id: null, // resolved during reconciliation against tier mapping
        customer_ref_hash: emailHash,
        currency: 'USD',
        gross_amount_minor: entitledCents,
        occurred_at: (attrs.last_charge_date as string) ?? new Date().toISOString(),
      },
      { onConflict: 'source,external_transaction_id', ignoreDuplicates: true },
    )
  }

  await db
    .from('webhook_events')
    .update({ processed_at: new Date().toISOString() })
    .eq('external_event_id', externalEventId)
    .eq('source', 'patreon')

  return json({ ok: true })
}
