import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Card, PageHeader, Section, Badge } from '../components/ui'
import { campaigns, offers, REQUIRED_DISCLOSURE } from '../demo/data'
import { formatMinor } from '../lib/money'

export function HomePage() {
  return (
    <div>
      <section className="py-10 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan">Secure Supplies Creator Partner Network</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          Learn. Build. Publish. Refer. <span className="text-green">Earn.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-steel-200">
          Promote real research, training, and build education from the Hydrogen Hot Rod Lab.
          Earn verified retail commissions and content rewards — never recruitment bonuses.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/apply" className="rounded-md bg-cyan px-5 py-2.5 font-bold text-navy hover:opacity-90">Apply as a Creator</Link>
          <Link to="/how-it-works" className="rounded-md border border-(--ss-line-strong) px-5 py-2.5 font-semibold text-offwhite hover:border-cyan">How it works</Link>
        </div>
      </section>

      <Section title="What the program is">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Approved campaign materials', 'Secure Supplies provides approved research, training, video, image, and product campaign materials — organized into ready-to-remix packs in EN, ES, DE, and PT-BR.'],
            ['Creators remix and publish', 'Approved creators select campaigns, remix or create platform-native content, and publish with a clear affiliate disclosure in the content itself.'],
            ['Verified results earn', 'Tracked retail sales earn Direct Retail Commissions. Approved qualified views may earn Content Rewards. Nothing is paid merely for recruiting another creator.'],
          ].map(([t, d]) => (
            <Card key={t}>
              <h3 className="mb-2 font-bold text-cyan">{t}</h3>
              <p className="text-sm text-steel-200">{d}</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="The commitments">
        <Card>
          <ul className="grid gap-2 text-sm text-steel-200 md:grid-cols-2">
            <li>• No payment for recruiting another promoter — ever.</li>
            <li>• No membership purchase required to become a creator.</li>
            <li>• No inventory or starter-kit requirement.</li>
            <li>• Earnings are not guaranteed.</li>
            <li>• All hydrogen content is educational and research based.</li>
            <li>• Every post carries a clear affiliate disclosure.</li>
          </ul>
        </Card>
      </Section>
    </div>
  )
}

export function HowItWorksPage() {
  const steps = [
    ['Apply', 'Submit your channels and languages. Applications are reviewed for fit and compliance readiness.'],
    ['Train', 'Complete the Academy: disclosure rules, approved and prohibited claims, and how commissions are calculated.'],
    ['Select a campaign', 'Pick from the Campaign Marketplace — each pack includes source clips, hooks, captions, and your tracked link and code.'],
    ['Remix and publish', 'Create platform-native content in the Remix Studio. Publish with the required disclosure visible in the content.'],
    ['Verified results', 'Sales are attributed via promo codes, Patreon identity, or 30-day tracked clicks. Views are verified before rewards.'],
    ['Get paid', 'Commissions move through: estimated → matched → confirmed → held → approved → payable → paid. Refunds reverse commissions.'],
  ]
  return (
    <div>
      <PageHeader title="How the program works" subtitle="Direct retail commissions, content rewards, and a transparent payout lifecycle." />
      <div className="grid gap-4 md:grid-cols-2">
        {steps.map(([t, d], i) => (
          <Card key={t}>
            <div className="mb-2 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan font-bold text-navy">{i + 1}</span>
              <h3 className="font-bold">{t}</h3>
            </div>
            <p className="text-sm text-steel-200">{d}</p>
          </Card>
        ))}
      </div>
      <Section title="Compensation channels">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-2 font-bold text-green">Direct Retail Commissions</h3>
            <ul className="space-y-1 text-sm text-steel-200">
              <li>First monthly membership payment: 25% of Net Collected Revenue</li>
              <li>Renewals months 2–12: 15%</li>
              <li>Annual memberships: 20%</li>
              <li>Books, calculators, files, digital tools: 25%</li>
              <li>Limited launch campaigns: up to 30%</li>
              <li>Refunded or disputed transactions: commission reversed</li>
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-green">Content Rewards</h3>
            <ul className="space-y-1 text-sm text-steel-200">
              <li>Approved remix: $5 + $1.25 per 1,000 verified qualified views (max $150/post)</li>
              <li>Original video: $20 + $3.00 per 1,000 verified qualified views (max $400/post)</li>
              <li>View rewards settle after a 30-day observation period</li>
              <li>Bot views, purchased engagement, and unapproved paid traffic are excluded</li>
            </ul>
          </Card>
        </div>
        <p className="mt-4 text-xs text-steel-300">
          Commission basis is Net Collected Revenue: cash actually collected minus indirect taxes, discounts,
          platform fees, processing fees, refunds, chargebacks, currency costs, and allocated payout fees.
          Earnings are not guaranteed and depend entirely on verified retail results.
        </p>
      </Section>
    </div>
  )
}

export function OffersPage() {
  return (
    <div>
      <PageHeader title="Offer categories" subtitle="Everything promoted is access to research, organized technical information, build education, and community." />
      <div className="grid gap-4 md:grid-cols-2">
        {offers.map((o) => (
          <Card key={o.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold">{o.name}</h3>
              <Badge value={o.kind} />
            </div>
            <p className="mt-2 text-sm text-steel-200">{o.description}</p>
            <p className="mt-2 font-mono text-sm text-cyan">{formatMinor(o.listPriceMinor, o.currency)}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function PublicCampaignsPage() {
  return (
    <div>
      <PageHeader title="Campaign preview" subtitle="A public look at active campaign packs. Full assets, hooks, and links are inside the Creator Command Center." />
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold">{c.name}</h3>
              <Badge value={c.difficulty} />
            </div>
            <p className="mt-1 text-sm text-steel-200">{c.objective}</p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
              {c.languages.map((l) => <span key={l} className="ss-chip bg-navy-700 text-steel-200">{l}</span>)}
              {c.platforms.map((p) => <span key={p} className="ss-chip bg-navy-700 text-cyan">{p}</span>)}
            </div>
            <p className="mt-3 text-xs text-steel-300">Commission: {c.commissionLabel}</p>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function ApplyPage() {
  const [submitted, setSubmitted] = useState(false)
  return (
    <div className="mx-auto max-w-xl">
      <PageHeader title="Creator application" subtitle="No purchase is required to apply or participate. Approval is based on fit, content quality, and compliance readiness." />
      {submitted ? (
        <Card>
          <h3 className="mb-2 font-bold text-green">Application received (demo)</h3>
          <p className="text-sm text-steel-200">
            In production this application enters the admin review queue. This demo does not store your details.
          </p>
        </Card>
      ) : (
        <Card>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              setSubmitted(true)
            }}
            className="space-y-4"
          >
            {[
              ['name', 'Display name', 'text'],
              ['email', 'Email address', 'email'],
              ['channel', 'Primary channel URL', 'url'],
            ].map(([id, label, type]) => (
              <div key={id}>
                <label htmlFor={id} className="mb-1 block text-sm font-semibold">{label}</label>
                <input id={id} type={type} required className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm" />
              </div>
            ))}
            <div>
              <label htmlFor="languages" className="mb-1 block text-sm font-semibold">Languages</label>
              <select id="languages" multiple className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm">
                {['English', 'Spanish', 'German', 'Portuguese (BR)'].map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="audience" className="mb-1 block text-sm font-semibold">Tell us about your audience</label>
              <textarea id="audience" rows={3} className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm" />
            </div>
            <label className="flex items-start gap-2 text-xs text-steel-200">
              <input type="checkbox" required className="mt-0.5" />
              <span>I understand that earnings are not guaranteed, that no compensation is paid for recruiting,
              and that all content must carry the required affiliate disclosure.</span>
            </label>
            <button type="submit" className="w-full rounded-md bg-cyan py-2.5 font-bold text-navy hover:opacity-90">Submit application</button>
          </form>
        </Card>
      )}
    </div>
  )
}

export function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <PageHeader title="Log in" />
      <Card>
        <p className="mb-4 text-sm text-steel-200">
          Production uses Supabase Auth (email magic link + optional OAuth). In this demo, use the
          role switcher in the header to preview the Creator and Admin portals.
        </p>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
          <label htmlFor="login-email" className="block text-sm font-semibold">Email address</label>
          <input id="login-email" type="email" className="w-full rounded-md border border-(--ss-line-strong) bg-navy-700 px-3 py-2 text-sm" />
          <button type="submit" className="w-full rounded-md bg-cyan py-2.5 font-bold text-navy opacity-60" disabled>
            Magic link disabled in demo
          </button>
        </form>
      </Card>
    </div>
  )
}

export function ReferralPage() {
  const { partnerCode, offerSlug } = useParams()
  const offer = offers.find((o) => o.slug === offerSlug)
  return (
    <div className="mx-auto max-w-lg text-center">
      <Card>
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-cyan">Referred by creator {partnerCode}</p>
        <h1 className="text-2xl font-extrabold">{offer?.name ?? 'Secure Supplies Research Access'}</h1>
        <p className="mt-2 text-sm text-steel-200">{offer?.description ?? 'Research, training, and build education from the Hydrogen Hot Rod Lab.'}</p>
        {offer && <p className="mt-3 font-mono text-lg text-cyan">{formatMinor(offer.listPriceMinor, offer.currency)}</p>}
        <div className="mt-5 space-y-2">
          <a
            href="https://www.patreon.com/cw/securesupplies"
            target="_blank"
            rel="noreferrer"
            className="block rounded-md bg-cyan py-2.5 font-bold text-navy hover:opacity-90"
          >
            Continue to Patreon
          </a>
          <p className="text-xs text-steel-300">
            In production this route records a 30-day first-party attribution click (track-click function)
            and offers Patreon OAuth identity binding before redirecting.
          </p>
        </div>
        <p className="mt-4 border-t border-(--ss-line) pt-3 text-xs text-steel-300">{REQUIRED_DISCLOSURE}</p>
      </Card>
    </div>
  )
}
