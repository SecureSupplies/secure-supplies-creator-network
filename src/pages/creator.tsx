import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Badge, Card, DataTable, Money, PageHeader, ProgressBar, Section, StatTile, type Column } from '../components/ui'
import {
  assets, campaignById, campaigns, clicks, commissions, creatorById, creatorEarnings,
  demoCreatorId, payoutBatches, rewards, submissions, REQUIRED_DISCLOSURE,
} from '../demo/data'
import { formatMinor } from '../lib/money'
import { scanText, hasDisclosure } from '../lib/compliance'

const me = creatorById(demoCreatorId)!
const myClicks = clicks.filter((c) => c.creatorId === demoCreatorId)
const myCommissions = commissions.filter((c) => c.creatorId === demoCreatorId)
const mySubmissions = submissions.filter((s) => s.creatorId === demoCreatorId)
const myRewards = rewards.filter((r) => r.creatorId === demoCreatorId)

export function CreatorDashboard() {
  const e = creatorEarnings(demoCreatorId)
  const conversionsCount = myCommissions.filter((c) => c.entryKind === 'retail').length
  const convRate = myClicks.length ? ((conversionsCount / myClicks.length) * 100).toFixed(1) : '0'
  return (
    <div>
      <PageHeader title={`Welcome back, ${me.name}`} subtitle={`Partner code ${me.partnerCode} · Status: ${me.status.replace(/_/g, ' ')}`} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Estimated" value={formatMinor(e.estimated, 'USD')} hint="Awaiting reconciliation" />
        <StatTile label="Held" value={formatMinor(e.held, 'USD')} hint="In 30–45 day hold" tone="warn" />
        <StatTile label="Payable" value={formatMinor(e.payable, 'USD')} tone="good" />
        <StatTile label="Paid" value={formatMinor(e.paid, 'USD')} tone="good" />
      </div>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Clicks" value={String(myClicks.length)} />
        <StatTile label="Conversions" value={String(conversionsCount)} />
        <StatTile label="Conversion rate" value={`${convRate}%`} />
        <StatTile label="Compliance score" value={String(me.complianceScore)} tone={me.complianceScore >= 95 ? 'good' : 'warn'} />
      </div>
      <Section title="Next recommended actions">
        <Card>
          <ul className="space-y-2 text-sm text-steel-200">
            <li>1. The <Link className="text-cyan underline" to="/creator/campaigns">Nano-Bubble launch campaign</Link> has an enhanced commission window until Sep 15.</li>
            <li>2. Two submissions need changes — see <Link className="text-cyan underline" to="/creator/submissions">Submissions</Link>.</li>
            <li>3. Add a Spanish version of your top post — translation bonus available in the multilingual campaign.</li>
          </ul>
        </Card>
      </Section>
      <Section title="Recent commissions">
        <CommissionTable rows={myCommissions.slice(0, 6)} />
      </Section>
    </div>
  )
}

export function CreatorCampaigns() {
  return (
    <div>
      <PageHeader title="Campaign Marketplace" subtitle="Select a campaign to view assets, hooks, links, and reward rates." />
      <div className="grid gap-4 lg:grid-cols-2">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold">{c.name}</h3>
              <Badge value={c.difficulty} />
            </div>
            <p className="mt-1 text-sm text-steel-200">{c.audience}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {c.languages.map((l) => <span key={l} className="ss-chip bg-navy-700 text-steel-200">{l}</span>)}
              {c.platforms.map((p) => <span key={p} className="ss-chip bg-navy-700 text-cyan">{p}</span>)}
            </div>
            <dl className="mt-3 space-y-1 text-xs text-steel-300">
              <div className="flex justify-between"><dt>Commission</dt><dd className="text-offwhite">{c.commissionLabel}</dd></div>
              <div className="flex justify-between"><dt>Content reward</dt><dd className="text-offwhite">{c.rewardLabel}</dd></div>
              <div className="flex justify-between"><dt>Assets</dt><dd className="text-offwhite">{c.assetCount}</dd></div>
              <div className="flex justify-between"><dt>Runs</dt><dd className="text-offwhite">{c.startsAt} → {c.endsAt ?? 'evergreen'}</dd></div>
            </dl>
            <div className="mt-3"><ProgressBar value={c.budgetSpentMinor} max={c.budgetTotalMinor} label={`Budget used (${formatMinor(c.budgetTotalMinor - c.budgetSpentMinor, 'USD')} remaining)`} /></div>
            <Link to={`/creator/campaigns/${c.id}`} className="mt-4 inline-block rounded-md bg-cyan px-4 py-1.5 text-sm font-bold text-navy">Open campaign</Link>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CreatorCampaignDetail() {
  const { campaignId } = useParams()
  const c = campaignById(campaignId ?? '')
  if (!c) return <PageHeader title="Campaign not found" />
  const campaignAssets = assets.filter((a) => a.campaignId === c.id).slice(0, 12)
  return (
    <div>
      <PageHeader title={c.name} subtitle={c.objective} />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Commission" value={c.commissionLabel.split(' ')[0]} hint={c.commissionLabel} />
        <StatTile label="Reward" value={c.rewardType === 'view_based' ? 'Per-view' : 'Flat'} hint={c.rewardLabel} />
        <StatTile label="Budget left" value={formatMinor(c.budgetTotalMinor - c.budgetSpentMinor, 'USD')} />
        <StatTile label="Assets" value={String(c.assetCount)} />
      </div>
      <Section title="Approved hooks">
        <Card><ul className="space-y-2 text-sm text-steel-200">{c.topHooks.map((h) => <li key={h}>“{h}”</li>)}</ul></Card>
      </Section>
      <Section title="Required disclosure">
        <Card><p className="text-sm text-green">{c.requiredDisclosure}</p></Card>
      </Section>
      <Section title="Prohibited claims">
        <Card><ul className="space-y-1 text-sm text-red">{c.prohibitedClaims.map((p) => <li key={p}>• {p}</li>)}</ul></Card>
      </Section>
      <Section title="Campaign assets">
        <DataTable
          columns={[
            { key: 'title', header: 'Asset', render: (a) => a.title },
            { key: 'type', header: 'Type', render: (a) => <Badge value={a.mediaType} /> },
            { key: 'lang', header: 'Language', render: (a) => a.language },
            { key: 'ratio', header: 'Ratio', render: (a) => a.aspectRatio },
            { key: 'rights', header: 'Rights', render: (a) => a.rightsStatus },
          ] satisfies Column<(typeof campaignAssets)[number]>[]}
          rows={campaignAssets}
        />
      </Section>
      <Link to="/creator/remix" className="rounded-md bg-cyan px-4 py-2 text-sm font-bold text-navy">Remix in Studio</Link>
    </div>
  )
}

export function CreatorAssets() {
  const [topic, setTopic] = useState('all')
  const [lang, setLang] = useState('all')
  const topics = ['all', ...new Set(assets.map((a) => a.topic))]
  const langs = ['all', ...new Set(assets.map((a) => a.language))]
  const filtered = assets.filter((a) => (topic === 'all' || a.topic === topic) && (lang === 'all' || a.language === lang))
  return (
    <div>
      <PageHeader title="Asset Vault" subtitle={`${assets.length} approved assets across ${campaigns.length} campaigns.`} />
      <div className="mb-4 flex flex-wrap gap-3">
        <label className="text-sm">Topic{' '}
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className="ml-1 rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1 text-sm">
            {topics.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <label className="text-sm">Language{' '}
          <select value={lang} onChange={(e) => setLang(e.target.value)} className="ml-1 rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1 text-sm">
            {langs.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
      </div>
      <DataTable
        columns={[
          { key: 'title', header: 'Asset', render: (a) => a.title },
          { key: 'campaign', header: 'Campaign', render: (a) => campaignById(a.campaignId)?.name ?? '—' },
          { key: 'type', header: 'Type', render: (a) => <Badge value={a.mediaType} /> },
          { key: 'lang', header: 'Lang', render: (a) => a.language },
          { key: 'dur', header: 'Duration', render: (a) => (a.durationSeconds ? `${a.durationSeconds}s` : '—') },
          { key: 'exp', header: 'Expires', render: (a) => a.expiresAt ?? '—' },
        ] satisfies Column<(typeof assets)[number]>[]}
        rows={filtered.slice(0, 40)}
      />
    </div>
  )
}

export function CreatorRemix() {
  const [ratio, setRatio] = useState<'9:16' | '1:1' | '16:9'>('9:16')
  const [hook, setHook] = useState(campaigns[1].topHooks[0])
  const [rendered, setRendered] = useState(false)
  return (
    <div>
      <PageHeader title="Remix Studio" subtitle="Trim, reframe, subtitle, brand, and export campaign assets. Cloud rendering is mocked in demo mode." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">1 · Source & trim</h3>
          <label className="mb-1 block text-sm font-semibold" htmlFor="src">Source clip</label>
          <select id="src" className="mb-3 w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5 text-sm">
            {assets.filter((a) => a.mediaType === 'mp4').slice(0, 8).map((a) => <option key={a.id}>{a.title}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm" htmlFor="in">In (s)<input id="in" type="number" defaultValue={4} className="mt-1 w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5" /></label>
            <label className="text-sm" htmlFor="out">Out (s)<input id="out" type="number" defaultValue={34} className="mt-1 w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5" /></label>
          </div>
          <fieldset className="mt-3">
            <legend className="text-sm font-semibold">Aspect ratio</legend>
            <div className="mt-1 flex gap-2">
              {(['9:16', '1:1', '16:9'] as const).map((r) => (
                <button key={r} onClick={() => setRatio(r)} aria-pressed={ratio === r}
                  className={`rounded-md px-3 py-1.5 text-sm font-semibold ${ratio === r ? 'bg-cyan text-navy' : 'border border-(--ss-line-strong) text-steel-200'}`}>
                  {r}
                </button>
              ))}
            </div>
          </fieldset>
        </Card>
        <Card>
          <h3 className="mb-3 font-bold">2 · Overlays</h3>
          <label className="mb-1 block text-sm font-semibold" htmlFor="hook">Approved hook</label>
          <select id="hook" value={hook} onChange={(e) => setHook(e.target.value)} className="mb-3 w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5 text-sm">
            {campaigns.flatMap((c) => c.topHooks).map((h) => <option key={h}>{h}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Secure Supplies logo overlay</label>
          <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> Creator handle ({me.handle})</label>
          <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked disabled /> Affiliate-disclosure overlay (required)</label>
          <label className="mt-1 flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked /> CTA end card + promo code</label>
          <label className="mt-3 mb-1 block text-sm font-semibold" htmlFor="sublang">Subtitle language</label>
          <select id="sublang" className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-2 py-1.5 text-sm">
            {['English', 'Spanish', 'German', 'Portuguese (BR)'].map((l) => <option key={l}>{l}</option>)}
          </select>
        </Card>
      </div>
      <Card className="mt-4">
        <h3 className="mb-3 font-bold">3 · Preview & render</h3>
        <div className={`mx-auto flex items-center justify-center rounded-lg border border-(--ss-line-strong) bg-navy-800 text-center text-xs text-steel-300 ${ratio === '9:16' ? 'h-64 w-36' : ratio === '1:1' ? 'h-52 w-52' : 'h-40 w-72'}`}>
          <div className="p-3">
            <p className="font-bold text-offwhite">“{hook.slice(0, 48)}…”</p>
            <p className="mt-2">{ratio} preview</p>
            <p className="mt-2 text-[0.6rem] text-green">Paid affiliate link — disclosure overlay</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button onClick={() => setRendered(true)} className="rounded-md bg-cyan px-4 py-2 text-sm font-bold text-navy">Request render</button>
          <button className="rounded-md border border-(--ss-line-strong) px-4 py-2 text-sm font-semibold">Save draft</button>
          <Link to="/creator/share" className="rounded-md border border-green px-4 py-2 text-sm font-semibold text-green">Continue to Share Center</Link>
        </div>
        {rendered && (
          <p className="mt-3 rounded-md bg-amber/10 p-3 text-center text-xs text-amber" role="status">
            Cloud render is not configured in demo mode — no video was produced. In production this
            submits to Creatomate/Shotstack via the render-media function. You can still download the
            campaign package for local editing.
          </p>
        )}
      </Card>
    </div>
  )
}

export function CreatorLinks() {
  const linkRows = campaigns.map((c) => ({
    id: c.id,
    campaign: c.name,
    url: `https://go.securesupplies.us/c/${me.partnerCode}/${c.slug}`,
    code: `${me.partnerCode}-${c.slug.split('-')[0].toUpperCase()}`,
  }))
  return (
    <div>
      <PageHeader title="My referral links" subtitle="Unique tracked links and promo codes. 30-day first-party attribution window." />
      <DataTable
        columns={[
          { key: 'campaign', header: 'Campaign', render: (r) => r.campaign },
          { key: 'url', header: 'Tracked link', render: (r) => <code className="text-xs text-cyan">{r.url}</code> },
          { key: 'code', header: 'Promo code', render: (r) => <code className="text-xs text-green">{r.code}</code> },
          { key: 'copy', header: '', render: (r) => <button onClick={() => navigator.clipboard?.writeText(r.url)} className="rounded border border-(--ss-line-strong) px-2 py-1 text-xs">Copy</button> },
        ] satisfies Column<(typeof linkRows)[number]>[]}
        rows={linkRows}
      />
      <p className="mt-4 text-xs text-steel-300">
        Attribution priority: redeemed promo code → authenticated Patreon identity → most recent eligible
        click within 30 days → approved manual claim (within 7 days) → otherwise organic. Self-referrals are never commissionable.
      </p>
    </div>
  )
}

export function CreatorShare() {
  const caption = `Most coil calculations fail before the winding even starts. The organized calculator pack is in the Hydrogen Hot Rod Lab. ${REQUIRED_DISCLOSURE}`
  const [url, setUrl] = useState('')
  const [saved, setSaved] = useState(false)
  return (
    <div>
      <PageHeader title="Share Center" subtitle="MVP flow: download, copy, post natively, then record your live URL. Connected auto-publishing requires your own authorized accounts." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Post package</h3>
          <p className="mb-2 rounded-md bg-navy-700 p-3 text-sm text-steel-200">{caption}</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigator.clipboard?.writeText(caption)} className="rounded-md bg-cyan px-3 py-1.5 text-xs font-bold text-navy">Copy caption + disclosure</button>
            <button onClick={() => navigator.clipboard?.writeText(`https://go.securesupplies.us/c/${me.partnerCode}/coil-calculators`)} className="rounded-md border border-(--ss-line-strong) px-3 py-1.5 text-xs font-semibold">Copy affiliate link</button>
            <button className="rounded-md border border-(--ss-line-strong) px-3 py-1.5 text-xs font-semibold">Download video</button>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            {['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X', 'LinkedIn', 'Pinterest'].map((p) => (
              <span key={p} className="ss-chip bg-navy-700 text-steel-200">{p}</span>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 font-bold">Record your live post</h3>
          <form onSubmit={(e) => { e.preventDefault(); setSaved(true) }} className="space-y-3">
            <label className="block text-sm font-semibold" htmlFor="live-url">Live post URL</label>
            <input id="live-url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://…" className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm" />
            <label className="flex items-start gap-2 text-xs text-steel-200">
              <input type="checkbox" required className="mt-0.5" />
              <span>The required affiliate disclosure is visible in this post.</span>
            </label>
            <label className="flex items-start gap-2 text-xs text-steel-200">
              <input type="checkbox" className="mt-0.5" />
              <span>This post uses paid traffic (requires pre-approval).</span>
            </label>
            <button type="submit" className="rounded-md bg-green px-4 py-2 text-sm font-bold text-navy">Submit for review</button>
            {saved && <p role="status" className="text-xs text-green">Recorded (demo). In production this creates a content submission for review.</p>}
          </form>
        </Card>
      </div>
    </div>
  )
}

export function CreatorSubmissions() {
  return (
    <div>
      <PageHeader title="Content submissions" />
      <DataTable
        columns={[
          { key: 'campaign', header: 'Campaign', render: (s) => campaignById(s.campaignId)?.name ?? '—' },
          { key: 'platform', header: 'Platform', render: (s) => s.platform },
          { key: 'type', header: 'Type', render: (s) => <Badge value={s.contentType} /> },
          { key: 'lang', header: 'Lang', render: (s) => s.language },
          { key: 'views', header: 'Qualified views', render: (s) => s.qualifiedViews.toLocaleString() },
          { key: 'score', header: 'Score', render: (s) => (s.score !== null ? `${s.score}/100` : '—') },
          { key: 'status', header: 'Status', render: (s) => <Badge value={s.status} /> },
        ] satisfies Column<(typeof mySubmissions)[number]>[]}
        rows={mySubmissions}
        emptyMessage="No submissions yet — pick a campaign and publish your first post."
      />
    </div>
  )
}

function CommissionTable({ rows }: { rows: typeof myCommissions }) {
  return (
    <DataTable
      columns={[
        { key: 'id', header: 'Entry', render: (c) => <code className="text-xs">{c.id}</code> },
        { key: 'kind', header: 'Kind', render: (c) => <Badge value={c.entryKind} /> },
        { key: 'rate', header: 'Rate', render: (c) => `${(c.rateBps / 100).toFixed(2)}%` },
        { key: 'amount', header: 'Amount', render: (c) => <Money minor={c.amountMinor} currency={c.currency} /> },
        { key: 'status', header: 'Status', render: (c) => <Badge value={c.status} /> },
        { key: 'date', header: 'Date', render: (c) => c.createdAt },
      ] satisfies Column<(typeof myCommissions)[number]>[]}
      rows={rows}
      emptyMessage="No commissions yet."
    />
  )
}

export function CreatorEarnings() {
  const e = creatorEarnings(demoCreatorId)
  return (
    <div>
      <PageHeader title="Earnings ledger" subtitle="Commissions are calculated on Net Collected Revenue and become payable after reconciliation and the hold period." />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Estimated" value={formatMinor(e.estimated, 'USD')} />
        <StatTile label="Held" value={formatMinor(e.held, 'USD')} tone="warn" />
        <StatTile label="Payable" value={formatMinor(e.payable, 'USD')} tone="good" />
        <StatTile label="Paid" value={formatMinor(e.paid, 'USD')} tone="good" />
      </div>
      <Section title="Commission entries"><CommissionTable rows={myCommissions} /></Section>
      <Section title="Content rewards">
        <DataTable
          columns={[
            { key: 'sub', header: 'Submission', render: (r) => <code className="text-xs">{r.submissionId}</code> },
            { key: 'bonus', header: 'Approval bonus', render: (r) => <Money minor={r.approvalBonusMinor} /> },
            { key: 'views', header: 'View reward', render: (r) => <Money minor={r.viewRewardMinor} /> },
            { key: 'payable', header: 'Payable', render: (r) => <Money minor={r.payableMinor} /> },
            { key: 'status', header: 'Status', render: (r) => <Badge value={r.status} /> },
          ] satisfies Column<(typeof myRewards)[number]>[]}
          rows={myRewards}
          emptyMessage="No content rewards yet."
        />
      </Section>
    </div>
  )
}

export function CreatorPayouts() {
  return (
    <div>
      <PageHeader title="Payouts" subtitle="Minimum payout $50. Monthly batches. Negative balances carry forward." />
      <DataTable
        columns={[
          { key: 'ref', header: 'Batch', render: (b) => b.reference },
          { key: 'total', header: 'My amount', render: () => <Money minor={18740} /> },
          { key: 'status', header: 'Status', render: (b) => <Badge value={b.status} /> },
          { key: 'date', header: 'Created', render: (b) => b.createdAt },
        ] satisfies Column<(typeof payoutBatches)[number]>[]}
        rows={payoutBatches}
      />
    </div>
  )
}

const academyModules = [
  ['How the referral system works', 'Attribution priority, the 30-day window, and why self-referrals are never paid.', 'complete'],
  ['Selecting campaigns', 'Reading campaign cards: commission, rewards, budget, difficulty, and eligibility.', 'complete'],
  ['Remixing content', 'Using the Remix Studio, asset rights, permitted edits, and expiration dates.', 'complete'],
  ['Affiliate disclosure', 'The required disclosure, where it must appear, and spoken + visual requirements for video.', 'complete'],
  ['Approved & prohibited claims', 'What you may say about experimental hydrogen research — and what you never may.', 'in_progress'],
  ['Copyright and licensing', 'Third-party content, music, and unauthorized clips.', 'pending'],
  ['No-spam rules & platform policies', 'Duplicate content, engagement groups, and platform-native standards.', 'pending'],
  ['How commissions are calculated', 'Net Collected Revenue, holds, reversals, and payout minimums.', 'pending'],
  ['Refunds, reversals, disputes', 'What happens to your commission when a customer refunds.', 'pending'],
] as const

export function CreatorAcademy() {
  return (
    <div>
      <PageHeader title="Academy" subtitle="Required training. Modules marked complete unlock priority campaigns." />
      <div className="grid gap-3 md:grid-cols-2">
        {academyModules.map(([title, desc, status]) => (
          <Card key={title}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-bold">{title}</h3>
              <Badge value={status === 'complete' ? 'approved' : status === 'in_progress' ? 'under_review' : 'draft'} />
            </div>
            <p className="mt-1 text-xs text-steel-200">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CreatorCompliance() {
  const [text, setText] = useState('')
  const hits = text ? scanText(text) : []
  const disclosureOk = text ? hasDisclosure(text) : null
  return (
    <div>
      <PageHeader title="Compliance" subtitle={`Your compliance score: ${me.complianceScore}/100. Flags trigger human review — they are never automatic conclusions.`} />
      <Section title="Pre-check your caption">
        <Card>
          <label className="mb-1 block text-sm font-semibold" htmlFor="cap">Paste a draft caption</label>
          <textarea id="cap" rows={4} value={text} onChange={(e) => setText(e.target.value)}
            className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm"
            placeholder="Try: 'Guaranteed results! Earn $500 per day…' to see the scanner work." />
          {text && (
            <div className="mt-3 space-y-2 text-sm">
              {disclosureOk === false && <p className="text-amber">⚠ Missing the required affiliate disclosure.</p>}
              {disclosureOk && <p className="text-green">✓ Affiliate disclosure detected.</p>}
              {hits.map((h) => <p key={h.id} className="text-red">✗ {h.label}: “{h.match}”</p>)}
              {hits.length === 0 && disclosureOk && <p className="text-green">✓ No prohibited-claim patterns found.</p>}
            </div>
          )}
        </Card>
      </Section>
      <Section title="The enforcement ladder">
        <Card>
          <p className="text-sm text-steel-200">
            Education notice → content correction → content removal → temporary campaign suspension →
            commission hold → program suspension → termination and reversal for fraud.
          </p>
        </Card>
      </Section>
    </div>
  )
}

export function CreatorProfile() {
  return (
    <div>
      <PageHeader title="Profile" />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-bold">Identity</h3>
          <dl className="space-y-2 text-sm">
            {[['Name', me.name], ['Handle', me.handle], ['Partner code', me.partnerCode], ['Country', me.country], ['Languages', me.languages.join(', ')], ['Joined', me.joinedAt], ['Status', me.status.replace(/_/g, ' ')]].map(([k, v]) => (
              <div key={k} className="flex justify-between"><dt className="text-steel-300">{k}</dt><dd>{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card>
          <h3 className="mb-3 font-bold">Payout & tax</h3>
          <p className="text-sm text-steel-200">Payout method: bank transfer ••••4821 (masked). Tax status: verified.</p>
          <h3 className="mt-4 mb-2 font-bold">Patreon connection</h3>
          <button className="rounded-md border border-cyan px-3 py-1.5 text-sm font-semibold text-cyan">Connect Patreon (OAuth) — mocked in demo</button>
          <h3 className="mt-4 mb-2 font-bold">Policy acceptances</h3>
          <ul className="space-y-1 text-xs text-steel-200">
            <li>✓ Partner Agreement v1.0 — accepted 2026-06-02</li>
            <li>✓ Marketing Standards v1.0 — accepted 2026-06-02</li>
            <li>✓ Content & IP License v1.0 — accepted 2026-06-02</li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
