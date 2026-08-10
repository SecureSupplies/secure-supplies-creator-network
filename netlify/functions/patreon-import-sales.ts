import { z } from 'zod'
import { isDemoMode, json, demoUnavailable } from '../lib/env'
import { hasSupabaseConfig, serviceClient, auditLog } from '../lib/supabase'

/**
 * patreon-import-sales — Patreon Shop / sales-export CSV import.
 *
 * There is NO official Patreon Shop-order API or webhook, so Shop
 * attribution works via: creator promo codes + admin CSV exports,
 * mapped through a configurable column-mapping template.
 *
 * Duplicate protection: unique (source, external_transaction_id).
 * Background function: suffix `-background` is applied via config export
 * in production deployments for large files; this handler also runs
 * synchronously for small imports.
 */
const rowSchema = z.object({
  transaction_id: z.string().min(1),
  product_slug: z.string().min(1),
  amount_minor: z.number().int().min(0),
  currency: z.string().regex(/^[A-Z]{3}$/),
  discount_code: z.string().optional().nullable(),
  status: z.enum(['paid', 'refunded', 'disputed']).default('paid'),
  occurred_at: z.string().min(4),
  tax_minor: z.number().int().min(0).default(0),
  platform_fee_minor: z.number().int().min(0).default(0),
  processing_fee_minor: z.number().int().min(0).default(0),
  discount_minor: z.number().int().min(0).default(0),
})

const bodySchema = z.object({
  jobId: z.string().uuid().optional(),
  rows: z.array(z.record(z.string(), z.unknown())).max(5000),
  columnMapping: z.record(z.string(), z.string()),
})

export default async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405)
  if (isDemoMode() || !hasSupabaseConfig()) return demoUnavailable('Sales import')

  const parsed = bodySchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, 400)
  const { rows, columnMapping } = parsed.data

  const db = serviceClient()
  let imported = 0
  let duplicates = 0
  const errors: Array<{ row: number; issues: unknown }> = []

  for (let i = 0; i < rows.length; i++) {
    // Apply configurable column mapping (tolerates changing export headers).
    const mapped: Record<string, unknown> = {}
    for (const [target, sourceCol] of Object.entries(columnMapping)) {
      mapped[target] = rows[i][sourceCol]
    }
    if (typeof mapped.amount_minor === 'string') mapped.amount_minor = Math.round(Number(mapped.amount_minor) * 100)
    for (const k of ['tax_minor', 'platform_fee_minor', 'processing_fee_minor', 'discount_minor']) {
      if (typeof mapped[k] === 'string') mapped[k] = Math.round(Number(mapped[k]) * 100)
    }

    const rowParsed = rowSchema.safeParse(mapped)
    if (!rowParsed.success) {
      errors.push({ row: i + 1, issues: rowParsed.error.issues })
      continue
    }
    const r = rowParsed.data

    const { data: offer } = await db.from('offers').select('id').eq('slug', r.product_slug).maybeSingle()
    if (!offer) {
      errors.push({ row: i + 1, issues: [`unknown product_slug: ${r.product_slug}`] })
      continue
    }

    // Map redeemed discount code → attribution.
    let attributionId: string | null = null
    if (r.discount_code) {
      const { data: code } = await db
        .from('discount_codes')
        .select('id, affiliate_id')
        .eq('code', r.discount_code)
        .maybeSingle()
      if (code?.affiliate_id) {
        const { data: attr } = await db
          .from('attributions')
          .insert({ method: 'promo_code', affiliate_id: code.affiliate_id, discount_code_id: code.id })
          .select('id')
          .single()
        attributionId = attr?.id ?? null
      }
    }

    const ncr =
      r.amount_minor - r.tax_minor - r.discount_minor - r.platform_fee_minor - r.processing_fee_minor
    const { error } = await db.from('conversions').insert({
      external_transaction_id: r.transaction_id,
      source: 'patreon_shop_import',
      offer_id: offer.id,
      attribution_id: attributionId,
      currency: r.currency,
      gross_amount_minor: r.amount_minor,
      tax_amount_minor: r.tax_minor,
      discount_amount_minor: r.discount_minor,
      platform_fee_minor: r.platform_fee_minor,
      processing_fee_minor: r.processing_fee_minor,
      refund_amount_minor: r.status === 'refunded' ? r.amount_minor : 0,
      net_collected_revenue_minor: Math.max(0, r.status === 'refunded' ? 0 : ncr),
      occurred_at: r.occurred_at,
    })
    if (error) {
      if (error.code === '23505') duplicates += 1
      else errors.push({ row: i + 1, issues: [error.message] })
      continue
    }
    imported += 1
  }

  await auditLog({
    action: 'import_sales',
    entityTable: 'conversions',
    reason: `${imported} imported, ${duplicates} duplicates, ${errors.length} errors`,
  })
  return json({ ok: true, imported, duplicates, errors })
}
