import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Badge, Card, DataTable, Money, PageHeader, ProgressBar, Section, StatTile, type Column } from '../components/ui'
import {
  assets, campaignById, campaigns, clicks, commissions, conversions, creatorById, creators,
  flags, offerById, offers, payoutBatches, rewards, submissions,
} from '../demo/data'
import { formatMinor } from '../lib/money'
import { DEFAULT_RULES } from '../lib/commission/types'

const totalNcr = conversions.filter((c) => c.status === 'paid').reduce((a, c) => a + c.ncrMinor, 0)
const commissionExpense = commissions.reduce((a, c) => a + Math.max(0, c.amountMinor), 0)
const rewardExpense = rewards.reduce((a, r) => a + r.payableMinor, 0)
const refundRate = conversions.filter((c) => c.status === 'refunded').length / conversions.length

export function AdminDashboard() {
  const publishing = new Set(submissions.map((s) => s.creatorId)).size
  const approvalRate = submissions.filter((s) => ['approved', 'published', 'reward_approved'].includes(s.status)).length / submissions.length
  const top5 = [...creators]
    .map((c) => ({ c, rev: commissions.filter((cm) => cm.creatorId === c.id).reduce((a, cm) => a + Math.max(0, cm.amountMinor), 0) }))
    .sort((a, b) => b.rev - a.rev).slice(0, 5)
  const top5Share = commissionExpense > 0 ? top5.reduce((a, t) => a + t.rev, 0) / commissionExpense : 0
  return (
    <div>
      <PageHeader title="Program dashboard" subtitle="All figures are fictional demo data." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Affiliate-attributed NCR" value={formatMinor(totalNcr, 'USD')} tone="good" />
        <StatTile label="Commission expense" value={formatMinor(commissionExpense, 'USD')} />
        <StatTile label="Content-reward expense" value={formatMinor(rewardExpense, 'USD')} />
        <StatTile label="Payout liability" value={formatMinor(commissionExpense - 128740, 'USD')} tone="warn" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Active creators" value={String(creators.length)} />
        <StatTile label="Publishing weekly" value={String(publishing)} hint={`${Math.round((publishing / creators.length) * 100)}% of roster`} />
        <StatTile label="Clicks (30d)" value={String(clicks.length)} />
        <StatTile label="Conversions" value={String(conversions.length)} />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Refund rate" value={`${(refundRate * 100).toFixed(1)}%`} tone={refundRate < 0.05 ? 'good' : 'warn'} hint="Target < 5%" />
        <StatTile label="Content approval" value={`${Math.round(approvalRate * 100)}%`} hint="Target 80%+" tone="good" />
        <StatTile label="Open fraud flags" value={String(flags.filter((f) => f.status === 'open').length)} tone="warn" />
        <StatTile label="Top-5 creator share" value={`${Math.round(top5Share * 100)}%`} hint="Target < 50% over time" tone={top5Share < 0.5 ? 'good' : 'warn'} />
      </div>
      <Section title="Campaign budget utilization">
        <Card>
          <div className="space-y-4">
            {campaigns.map((c) => (
              <ProgressBar key={c.id} value={c.budgetSpentMinor} max={c.budgetTotalMinor} label={c.name} />
            ))}
          </div>
        </Card>
      </Section>
      <Section title="Top creators by commission">
        <DataTable
          columns={[
            { key: 'name', header: 'Creator', render: (r) => r.c.name },
            { key: 'code', header: 'Code', render: (r) => <code className="text-xs">{r.c.partnerCode}</code> },
            { key: 'status', header: 'Level', render: (r) => <Badge value={r.c.status} /> },
            { key: 'rev', header: 'Commission', render: (r) => <Money minor={r.rev} /> },
          ] satisfies Column<{ id: string; c: (typeof creators)[number]; rev: number }>[]}
          rows={top5.map((t) => ({ id: t.c.id, ...t }))}
        />
      </Section>
    </div>
  )
}

const demoApplications = [
  { id: 'ap-1', name: 'Nina R.', email: 'demo-nina@example.com', channel: 'youtube.com/@nina_builds', languages: 'EN, DE', status: 'pending' },
  { id: 'ap-2', name: 'Paulo S.', email: 'demo-paulo@example.com', channel: 'tiktok.com/@paulo_h2', languages: 'PT-BR', status: 'pending' },
  { id: 'ap-3', name: 'Astrid M.', email: 'demo-astrid@example.com', channel: 'instagram.com/astrid.energy', languages: 'DE, EN', status: 'approved' },
  { id: 'ap-4', name: 'Jorge L.', email: 'demo-jorge@example.com', channel: 'youtube.com/@jorge_taller', languages: 'ES', status: 'rejected' },
]

export function AdminApplications() {
  return (
    <div>
      <PageHeader title="Creator applications" />
      <DataTable
        columns={[
          { key: 'name', header: 'Applicant', render: (a) => a.name },
          { key: 'email', header: 'Email', render: (a) => a.email },
          { key: 'channel', header: 'Channel', render: (a) => <code className="text-xs">{a.channel}</code> },
          { key: 'lang', header: 'Languages', render: (a) => a.languages },
          { key: 'status', header: 'Status', render: (a) => <Badge value={a.status} /> },
          { key: 'actions', header: '', render: (a) => a.status === 'pending' ? (
            <span className="flex gap-1">
              <button className="rounded bg-green px-2 py-1 text-xs font-bold text-navy">Approve</button>
              <button className="rounded border border-red px-2 py-1 text-xs text-red">Reject</button>
            </span>
          ) : null },
        ] satisfies Column<(typeof demoApplications)[number]>[]}
        rows={demoApplications}
      />
    </div>
  )
}

export function AdminCreators() {
  return (
    <div>
      <PageHeader title="Creators" subtitle={`${creators.length} approved creators.`} />
      <DataTable
        columns={[
          { key: 'name', header: 'Creator', render: (c) => <Link className="text-cyan underline" to={`/admin/creators/${c.id}`}>{c.name}</Link> },
          { key: 'code', header: 'Code', render: (c) => <code className="text-xs">{c.partnerCode}</code> },
          { key: 'status', header: 'Level', render: (c) => <Badge value={c.status} /> },
          { key: 'lang', header: 'Languages', render: (c) => c.languages.join(', ') },
          { key: 'country', header: 'Country', render: (c) => c.country },
          { key: 'score', header: 'Compliance', render: (c) => `${c.complianceScore}/100` },
          { key: 'joined', header: 'Joined', render: (c) => c.joinedAt },
        ] satisfies Column<(typeof creators)[number]>[]}
        rows={creators}
      />
    </div>
  )
}

export function AdminCreatorDetail() {
  const { creatorId } = useParams()
  const c = creatorById(creatorId ?? '')
  if (!c) return <PageHeader title="Creator not found" />
  const cCommissions = commissions.filter((cm) => cm.creatorId === c.id)
  const cSubs = submissions.filter((s) => s.creatorId === c.id)
  const cFlags = flags.filter((f) => f.creatorId === c.id)
  return (
    <div>
      <PageHeader title={c.name} subtitle={`${c.partnerCode} · ${c.status.replace(/_/g, ' ')} · compliance ${c.complianceScore}/100`}
        actions={<button className="rounded-md border border-red px-3 py-1.5 text-sm text-red">Suspend</button>} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Commission entries" value={String(cCommissions.length)} />
        <StatTile label="Submissions" value={String(cSubs.length)} />
        <StatTile label="Open flags" value={String(cFlags.filter((f) => f.status === 'open').length)} tone={cFlags.some((f) => f.status === 'open') ? 'warn' : 'good'} />
        <StatTile label="Total earned" value={formatMinor(cCommissions.reduce((a, x) => a + x.amountMinor, 0), 'USD')} />
      </div>
      <Section title="Commissions">
        <DataTable
          columns={[
            { key: 'id', header: 'Entry', render: (x) => <code className="text-xs">{x.id}</code> },
            { key: 'kind', header: 'Kind', render: (x) => <Badge value={x.entryKind} /> },
            { key: 'amount', header: 'Amount', render: (x) => <Money minor={x.amountMinor} currency={x.currency} /> },
            { key: 'status', header: 'Status', render: (x) => <Badge value={x.status} /> },
          ] satisfies Column<(typeof cCommissions)[number]>[]}
          rows={cCommissions}
          emptyMessage="No commissions."
        />
      </Section>
      <Section title="Compliance flags">
        <DataTable
          columns={[
            { key: 'type', header: 'Flag', render: (f) => f.flagType.replace(/_/g, ' ') },
            { key: 'sev', header: 'Severity', render: (f) => <Badge value={f.severity} /> },
            { key: 'status', header: 'Status', render: (f) => <Badge value={f.status} /> },
            { key: 'date', header: 'Date', render: (f) => f.createdAt },
          ] satisfies Column<(typeof cFlags)[number]>[]}
          rows={cFlags}
          emptyMessage="No flags."
        />
      </Section>
    </div>
  )
}

export function AdminOffers() {
  return (
    <div>
      <PageHeader title="Offers" />
      <DataTable
        columns={[
          { key: 'name', header: 'Offer', render: (o) => o.name },
          { key: 'slug', header: 'Slug', render: (o) => <code className="text-xs">{o.slug}</code> },
          { key: 'kind', header: 'Kind', render: (o) => <Badge value={o.kind} /> },
          { key: 'price', header: 'List price', render: (o) => <Money minor={o.listPriceMinor} currency={o.currency} /> },
        ] satisfies Column<(typeof offers)[number]>[]}
        rows={offers}
      />
    </div>
  )
}

export function AdminCommissionRules() {
  const r = DEFAULT_RULES
  return (
    <div>
      <PageHeader title="Commission rules" subtitle={`Active rule version: ${r.version}. Rules are versioned — every commission entry records the version used.`} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-2 font-bold">Memberships</h3>
          <ul className="space-y-1 text-sm text-steel-200">
            <li>First payment: {r.monthly_membership.first_payment_bps / 100}% of NCR</li>
            <li>Renewals {r.monthly_membership.renewal_start_number}–{r.monthly_membership.renewal_end_number}: {r.monthly_membership.renewal_bps / 100}%</li>
            <li>Annual: {r.annual_membership.payment_bps / 100}%</li>
          </ul>
        </Card>
        <Card>
          <h3 className="mb-2 font-bold">Products</h3>
          <ul className="space-y-1 text-sm text-steel-200">
            <li>Digital products: {r.digital_product.payment_bps / 100}%</li>
            <li>Launch maximum: {r.launch_product.maximum_bps / 100}%</li>
            <li>High-touch: {r.high_touch.first_payment_min_bps / 100}–{r.high_touch.first_payment_max_bps / 100}% first payment only</li>
          </ul>
        </Card>
        <Card>
          <h3 className="mb-2 font-bold">Content rewards</h3>
          <ul className="space-y-1 text-sm text-steel-200">
            <li>Remix: $5 + $1.25/1k views, cap $150</li>
            <li>Original: $20 + $3.00/1k views, cap $400</li>
          </ul>
        </Card>
        <Card>
          <h3 className="mb-2 flex items-center justify-between font-bold">
            Certified Team Lead override
            <Badge value={r.team_lead_override.enabled ? 'approved' : 'draft'} />
          </h3>
          <ul className="space-y-1 text-sm text-steel-200">
            <li>Status: <strong className="text-amber">DISABLED (feature flag off)</strong></li>
            <li>If ever enabled: {r.team_lead_override.bps / 100}% of NCR, max {r.team_lead_override.maximum_months} months, {r.team_lead_override.maximum_levels} level only</li>
            <li>Paid only on verified retail sales by a directly trained creator — never for recruiting</li>
            <li>Requires separate legal review before activation</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}

export function AdminCampaigns() {
  return (
    <div>
      <PageHeader title="Campaigns" />
      <DataTable
        columns={[
          { key: 'name', header: 'Campaign', render: (c) => <Link className="text-cyan underline" to={`/admin/campaigns/${c.id}`}>{c.name}</Link> },
          { key: 'offer', header: 'Offer', render: (c) => offerById(c.offerId)?.name ?? '—' },
          { key: 'reward', header: 'Reward type', render: (c) => c.rewardType.replace('_', ' ') },
          { key: 'budget', header: 'Budget', render: (c) => `${formatMinor(c.budgetSpentMinor, 'USD')} / ${formatMinor(c.budgetTotalMinor, 'USD')}` },
          { key: 'ends', header: 'Ends', render: (c) => c.endsAt ?? 'evergreen' },
        ] satisfies Column<(typeof campaigns)[number]>[]}
        rows={campaigns}
      />
    </div>
  )
}

export function AdminCampaignDetail() {
  const { campaignId } = useParams()
  const c = campaignById(campaignId ?? '')
  if (!c) return <PageHeader title="Campaign not found" />
  const cSubs = submissions.filter((s) => s.campaignId === c.id)
  return (
    <div>
      <PageHeader title={c.name} subtitle={c.objective} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Budget spent" value={formatMinor(c.budgetSpentMinor, 'USD')} hint={`of ${formatMinor(c.budgetTotalMinor, 'USD')}`} />
        <StatTile label="Assets" value={String(c.assetCount)} />
        <StatTile label="Submissions" value={String(cSubs.length)} />
        <StatTile label="Languages" value={c.languages.join(' ')} />
      </div>
      <Section title="Submissions for this campaign">
        <DataTable
          columns={[
            { key: 'creator', header: 'Creator', render: (s) => creatorById(s.creatorId)?.name ?? '—' },
            { key: 'platform', header: 'Platform', render: (s) => s.platform },
            { key: 'views', header: 'Views', render: (s) => s.qualifiedViews.toLocaleString() },
            { key: 'status', header: 'Status', render: (s) => <Badge value={s.status} /> },
          ] satisfies Column<(typeof cSubs)[number]>[]}
          rows={cSubs}
          emptyMessage="No submissions yet."
        />
      </Section>
    </div>
  )
}

export function AdminAssets() {
  return (
    <div>
      <PageHeader title="Asset library" subtitle={`${assets.length} assets with rights metadata.`} />
      <DataTable
        columns={[
          { key: 'title', header: 'Asset', render: (a) => a.title },
          { key: 'campaign', header: 'Campaign', render: (a) => campaignById(a.campaignId)?.name ?? '—' },
          { key: 'type', header: 'Type', render: (a) => <Badge value={a.mediaType} /> },
          { key: 'rights', header: 'Rights', render: (a) => a.rightsStatus },
          { key: 'expires', header: 'Expires', render: (a) => a.expiresAt ?? '—' },
        ] satisfies Column<(typeof assets)[number]>[]}
        rows={assets.slice(0, 30)}
      />
    </div>
  )
}

export function AdminSubmissions() {
  return (
    <div>
      <PageHeader title="Content review queue" />
      <DataTable
        columns={[
          { key: 'creator', header: 'Creator', render: (s) => creatorById(s.creatorId)?.name ?? '—' },
          { key: 'campaign', header: 'Campaign', render: (s) => campaignById(s.campaignId)?.name ?? '—' },
          { key: 'url', header: 'Live URL', render: (s) => <code className="text-xs">{s.liveUrl.slice(0, 40)}…</code> },
          { key: 'type', header: 'Type', render: (s) => <Badge value={s.contentType} /> },
          { key: 'score', header: 'Score', render: (s) => (s.score !== null ? `${s.score}/100` : '—') },
          { key: 'status', header: 'Status', render: (s) => <Badge value={s.status} /> },
          { key: 'actions', header: '', render: (s) => ['submitted', 'under_review'].includes(s.status) ? (
            <span className="flex gap-1">
              <button className="rounded bg-green px-2 py-1 text-xs font-bold text-navy">Approve</button>
              <button className="rounded border border-amber px-2 py-1 text-xs text-amber">Changes</button>
              <button className="rounded border border-red px-2 py-1 text-xs text-red">Reject</button>
            </span>
          ) : null },
        ] satisfies Column<(typeof submissions)[number]>[]}
        rows={submissions}
      />
      <p className="mt-3 text-xs text-steel-300">
        Review scoring: originality 20 · brand compliance 20 · hook & retention 20 · CTA clarity 15 · conversion relevance 15 · disclosure & compliance 10.
      </p>
    </div>
  )
}

export function AdminConversions() {
  return (
    <div>
      <PageHeader title="Conversions" subtitle="Membership webhooks + Shop CSV imports, reconciled to Net Collected Revenue." />
      <DataTable
        columns={[
          { key: 'ext', header: 'Transaction', render: (c) => <code className="text-xs">{c.externalId}</code> },
          { key: 'offer', header: 'Offer', render: (c) => offerById(c.offerId)?.name ?? '—' },
          { key: 'source', header: 'Source', render: (c) => c.source.replace(/_/g, ' ') },
          { key: 'attr', header: 'Attribution', render: (c) => <Badge value={c.attributionMethod} /> },
          { key: 'gross', header: 'Gross', render: (c) => <Money minor={c.grossMinor} currency={c.currency} /> },
          { key: 'ncr', header: 'NCR', render: (c) => <Money minor={c.ncrMinor} currency={c.currency} /> },
          { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
          { key: 'date', header: 'Date', render: (c) => c.occurredAt },
        ] satisfies Column<(typeof conversions)[number]>[]}
        rows={conversions}
      />
    </div>
  )
}

export function AdminCommissions() {
  return (
    <div>
      <PageHeader title="Commission ledger" subtitle="Lifecycle: estimated → attributed → pending payment → held → approved → payable → paid. Refunds create negative reversal entries." />
      <DataTable
        columns={[
          { key: 'id', header: 'Entry', render: (c) => <code className="text-xs">{c.id}</code> },
          { key: 'creator', header: 'Creator', render: (c) => creatorById(c.creatorId)?.name ?? '—' },
          { key: 'kind', header: 'Kind', render: (c) => <Badge value={c.entryKind} /> },
          { key: 'rate', header: 'Rate', render: (c) => `${(c.rateBps / 100).toFixed(2)}%` },
          { key: 'amount', header: 'Amount', render: (c) => <Money minor={c.amountMinor} currency={c.currency} /> },
          { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
          { key: 'date', header: 'Date', render: (c) => c.createdAt },
        ] satisfies Column<(typeof commissions)[number]>[]}
        rows={commissions}
      />
    </div>
  )
}

export function AdminPayouts() {
  return (
    <div>
      <PageHeader title="Payout batches" subtitle="Draft → under review → approved → processing → paid. No real payments execute in demo mode."
        actions={<button className="rounded-md bg-cyan px-4 py-2 text-sm font-bold text-navy">Create batch (demo)</button>} />
      <DataTable
        columns={[
          { key: 'ref', header: 'Reference', render: (b) => b.reference },
          { key: 'items', header: 'Items', render: (b) => String(b.itemCount) },
          { key: 'total', header: 'Total', render: (b) => <Money minor={b.totalMinor} currency={b.currency} /> },
          { key: 'status', header: 'Status', render: (b) => <Badge value={b.status} /> },
          { key: 'date', header: 'Created', render: (b) => b.createdAt },
          { key: 'export', header: '', render: () => <button className="rounded border border-(--ss-line-strong) px-2 py-1 text-xs">Export CSV</button> },
        ] satisfies Column<(typeof payoutBatches)[number]>[]}
        rows={payoutBatches}
      />
      <p className="mt-3 text-xs text-steel-300">Minimum payout $50 · monthly batches · negative balances carry forward · tax status must be verified before payment.</p>
    </div>
  )
}

export function AdminImports() {
  const [step, setStep] = useState(1)
  return (
    <div>
      <PageHeader title="Sales import wizard" subtitle="Patreon has no Shop-order API — Shop sales are reconciled via CSV export + promo-code mapping." />
      <Card>
        <ol className="mb-4 flex flex-wrap gap-2 text-xs">
          {['Upload CSV', 'Map columns', 'Preview & validate', 'Import'].map((s, i) => (
            <li key={s} className={`ss-chip ${step === i + 1 ? 'bg-cyan text-navy' : 'bg-navy-700 text-steel-200'}`}>{i + 1}. {s}</li>
          ))}
        </ol>
        {step === 1 && (
          <div>
            <label htmlFor="csv" className="mb-1 block text-sm font-semibold">Patreon sales export (.csv)</label>
            <input id="csv" type="file" accept=".csv" className="mb-3 block text-sm" />
            <p className="mb-3 text-xs text-steel-300">Saved mapping templates: “Patreon Shop 2026-07” · “Refund adjustments”. Blank templates are in /templates.</p>
            <button onClick={() => setStep(2)} className="rounded-md bg-cyan px-4 py-2 text-sm font-bold text-navy">Continue</button>
          </div>
        )}
        {step === 2 && (
          <div>
            <p className="mb-3 text-sm text-steel-200">Map export columns to system fields (tolerates changing column names):</p>
            <div className="grid gap-2 md:grid-cols-2">
              {[['transaction_id', 'Order ID'], ['product_slug', 'Product Name'], ['amount_minor', 'Amount'], ['currency', 'Currency'], ['discount_code', 'Coupon'], ['status', 'Status'], ['occurred_at', 'Date']].map(([field, col]) => (
                <label key={field} className="text-xs">
                  <span className="font-mono text-cyan">{field}</span>
                  <select defaultValue={col} className="mt-1 w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5 text-sm">
                    {['Order ID', 'Product Name', 'Amount', 'Currency', 'Coupon', 'Status', 'Date', '— unmapped —'].map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="mt-4 rounded-md bg-cyan px-4 py-2 text-sm font-bold text-navy">Preview</button>
          </div>
        )}
        {step === 3 && (
          <div>
            <p className="mb-2 text-sm text-steel-200">Validation preview (demo rows):</p>
            <ul className="mb-3 space-y-1 text-xs">
              <li className="text-green">✓ 46 rows valid</li>
              <li className="text-amber">⚠ 3 duplicate transaction IDs — will be skipped</li>
              <li className="text-red">✗ 1 row invalid: unknown product_slug "old-calculator" (row 12)</li>
            </ul>
            <button onClick={() => setStep(4)} className="rounded-md bg-green px-4 py-2 text-sm font-bold text-navy">Import 46 rows</button>
          </div>
        )}
        {step === 4 && (
          <p role="status" className="text-sm text-green">
            Demo import complete: 46 conversions created, 11 matched to promo codes, 2 refunds reversed
            commissions. Error report available for download. (No data was actually written in demo mode.)
          </p>
        )}
      </Card>
    </div>
  )
}

const demoCodes = creators.slice(0, 10).map((c, i) => ({
  id: `dc-${i}`,
  code: `${c.partnerCode}-COIL`,
  creator: c.name,
  offer: 'Stanley A. Meyer Coil Calculators',
  type: i % 4 === 0 ? 'membership' : 'product',
  redemptions: (i * 7) % 23,
}))

export function AdminDiscountCodes() {
  return (
    <div>
      <PageHeader title="Discount codes" subtitle="Membership codes are feature-flagged — Patreon membership discounts may not be available on every account." />
      <DataTable
        columns={[
          { key: 'code', header: 'Code', render: (c) => <code className="text-xs text-green">{c.code}</code> },
          { key: 'creator', header: 'Creator', render: (c) => c.creator },
          { key: 'offer', header: 'Offer', render: (c) => c.offer },
          { key: 'type', header: 'Type', render: (c) => <Badge value={c.type} /> },
          { key: 'red', header: 'Redemptions', render: (c) => String(c.redemptions) },
        ] satisfies Column<(typeof demoCodes)[number]>[]}
        rows={demoCodes}
      />
    </div>
  )
}

export function AdminFraud() {
  const fraudFlags = flags.filter((f) => ['serious', 'critical'].includes(f.severity))
  return (
    <div>
      <PageHeader title="Fraud review" subtitle="Heuristics: self-referral, duplicate transactions/URLs, click bursts, impossible conversion rates, refund patterns, suspicious view growth, code misuse." />
      <DataTable
        columns={[
          { key: 'creator', header: 'Creator', render: (f) => creatorById(f.creatorId)?.name ?? '—' },
          { key: 'type', header: 'Signal', render: (f) => f.flagType.replace(/_/g, ' ') },
          { key: 'sev', header: 'Severity', render: (f) => <Badge value={f.severity} /> },
          { key: 'status', header: 'Status', render: (f) => <Badge value={f.status} /> },
          { key: 'date', header: 'Raised', render: (f) => f.createdAt },
          { key: 'act', header: '', render: () => (
            <span className="flex gap-1">
              <button className="rounded border border-(--ss-line-strong) px-2 py-1 text-xs">Review</button>
              <button className="rounded border border-red px-2 py-1 text-xs text-red">Hold commissions</button>
            </span>
          ) },
        ] satisfies Column<(typeof fraudFlags)[number]>[]}
        rows={fraudFlags}
        emptyMessage="No fraud signals."
      />
      <p className="mt-3 text-xs text-steel-300">Detection thresholds are staff-only and never exposed to creators. Flags trigger review — not automatic conclusions.</p>
    </div>
  )
}

export function AdminCompliance() {
  return (
    <div>
      <PageHeader title="Compliance queue" />
      <DataTable
        columns={[
          { key: 'creator', header: 'Creator', render: (f) => creatorById(f.creatorId)?.name ?? '—' },
          { key: 'type', header: 'Flag', render: (f) => f.flagType.replace(/_/g, ' ') },
          { key: 'sev', header: 'Severity', render: (f) => <Badge value={f.severity} /> },
          { key: 'status', header: 'Status', render: (f) => <Badge value={f.status} /> },
          { key: 'act', header: 'Next step', render: (f) => f.status === 'open' ? 'Education notice' : f.status === 'reviewing' ? 'Content correction' : '—' },
        ] satisfies Column<(typeof flags)[number]>[]}
        rows={flags}
      />
      <p className="mt-3 text-xs text-steel-300">Ladder: education → correction → removal → campaign suspension → commission hold → program suspension → termination.</p>
    </div>
  )
}

const demoAudit = [
  { id: 'au-1', at: '2026-08-01 09:12', actor: 'admin (demo)', action: 'create_payout_batch', entity: 'payout_batches', reason: 'DEMO-BATCH-2026-07' },
  { id: 'au-2', at: '2026-07-30 14:03', actor: 'system', action: 'finalize_commissions', entity: 'commission_entries', reason: '6 entries released to payable' },
  { id: 'au-3', at: '2026-07-29 11:47', actor: 'reviewer (demo)', action: 'submission_approved', entity: 'content_submissions', reason: 'sb-4 score 91' },
  { id: 'au-4', at: '2026-07-28 16:20', actor: 'admin (demo)', action: 'reverse_commission', entity: 'commission_entries', reason: 'Refund TXN DEMO-TXN-1009' },
  { id: 'au-5', at: '2026-07-27 08:05', actor: 'system', action: 'patreon_member_sync', entity: 'webhook_events', reason: '412 members' },
]

export function AdminAudit() {
  return (
    <div>
      <PageHeader title="Audit log" subtitle="Immutable — entries can never be updated or deleted." />
      <DataTable
        columns={[
          { key: 'at', header: 'Time', render: (a) => a.at },
          { key: 'actor', header: 'Actor', render: (a) => a.actor },
          { key: 'action', header: 'Action', render: (a) => <code className="text-xs">{a.action}</code> },
          { key: 'entity', header: 'Entity', render: (a) => a.entity },
          { key: 'reason', header: 'Reason', render: (a) => a.reason },
        ] satisfies Column<(typeof demoAudit)[number]>[]}
        rows={demoAudit}
      />
    </div>
  )
}

export function AdminSettings() {
  return (
    <div>
      <PageHeader title="System settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Feature flags</h3>
          <ul className="space-y-2 text-sm">
            {[['Team Lead override', false, 'Requires legal review before activation'],
              ['Membership discount codes', false, 'Patreon feature availability varies by account'],
              ['Connected social publishing', false, 'Requires AYRSHARE_API_KEY'],
              ['Cloud media rendering', false, 'Requires CREATOMATE_API_KEY or SHOTSTACK_API_KEY'],
              ['Whop commerce adapter', false, 'Optional — selected offers only']].map(([name, on, note]) => (
              <li key={String(name)} className="flex items-start justify-between gap-3">
                <div><p className="font-semibold">{name}</p><p className="text-xs text-steel-300">{note}</p></div>
                <Badge value={on ? 'approved' : 'draft'} />
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 className="mb-3 font-bold">Integration health</h3>
          <ul className="space-y-2 text-sm text-steel-200">
            <li>Supabase: <span className="text-amber">demo mode (mock data)</span></li>
            <li>Patreon API: <span className="text-amber">not configured</span></li>
            <li>Last member sync: —</li>
            <li>Webhook signature verification: <span className="text-green">enforced when configured</span></li>
          </ul>
          <p className="mt-3 text-xs text-steel-300">The /api/health and /api/patreon-health endpoints report live status in production.</p>
        </Card>
      </div>
    </div>
  )
}
