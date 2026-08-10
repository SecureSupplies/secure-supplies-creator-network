import { Link } from 'react-router-dom'
import { Card, PageHeader, Section, Badge } from '../components/ui'

const DISCLOSURE = 'Paid affiliate link — I may earn a commission if you purchase or join through this link.'

/* ============================================================
   PUBLIC /earn — recruitment teaser page
   ============================================================ */
export function EarnPage() {
  return (
    <div>
      <section className="py-10 text-center">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.3em] text-cyan">Creator Partner Program</p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight md:text-5xl">
          Share real hydrogen tech. <span className="text-green">Earn real commissions.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-steel-200">
          Free to join. No inventory. No recruiting. You earn when your audience buys —
          memberships, research collections, calculators, and training. Earnings are never guaranteed;
          good content that converts is the whole game.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link to="/apply" className="rounded-md bg-green px-5 py-2.5 font-bold text-navy hover:opacity-90">Apply now — it&apos;s free</Link>
          <Link to="/how-it-works" className="rounded-md border border-(--ss-line-strong) px-5 py-2.5 font-semibold text-offwhite hover:border-cyan">How it works</Link>
        </div>
      </section>

      <Section title="What you earn">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <h3 className="mb-2 font-bold text-cyan">Sales commissions</h3>
            <ul className="space-y-1 text-sm text-steel-200">
              <li>• 25% of net revenue — new monthly membership</li>
              <li>• 15% — renewals, months 2–12</li>
              <li>• 20% — annual memberships</li>
              <li>• 25% — digital products</li>
              <li>• Up to 30% — launch campaigns</li>
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-cyan">Content rewards</h3>
            <ul className="space-y-1 text-sm text-steel-200">
              <li>• Approved remix: $5 + $1.25 per 1,000 verified views (cap $150/post)</li>
              <li>• Original video: $20 + $3.00 per 1,000 verified views (cap $400/post)</li>
              <li>• Paid on top of sales commissions</li>
            </ul>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-cyan">What you get</h3>
            <ul className="space-y-1 text-sm text-steel-200">
              <li>• Personal tracked link + promo code</li>
              <li>• Licensed asset vault: clips, images, captions</li>
              <li>• Remix Studio for platform-native cuts</li>
              <li>• Live dashboard: clicks, sales, earnings</li>
              <li>• Monthly payouts (PayPal / Wise / bank)</li>
            </ul>
          </Card>
        </div>
      </Section>

      <Section title="The straight facts">
        <Card>
          <ul className="grid gap-2 text-sm text-steel-200 md:grid-cols-2">
            <li>• Nobody is paid for recruiting — retail sales only.</li>
            <li>• No purchase ever required to participate.</li>
            <li>• $50 payout minimum · monthly batches · 30–45 day hold.</li>
            <li>• Refunds reverse commissions. Bots and bought views get you removed.</li>
            <li>• Every post must carry the affiliate disclosure.</li>
            <li>• Earnings are not guaranteed and depend on your audience and effort.</li>
          </ul>
        </Card>
      </Section>

      <section className="py-8 text-center">
        <Link to="/apply" className="rounded-md bg-green px-6 py-3 font-bold text-navy hover:opacity-90">Start your application</Link>
      </section>
    </div>
  )
}

/* ============================================================
   CREATOR /creator/fast-start — 48-hour checklist
   ============================================================ */
export function FastStartPage() {
  const steps: Array<[string, string]> = [
    ['Complete the Academy', 'Locked campaigns unlock the moment you finish. 20 minutes. Do it first — everything else depends on it.'],
    ['Pick ONE campaign', 'Open Campaigns and choose the launch campaign or a product campaign (products pay full commission on day one — a $79 collection pays ~$18–19 immediately; memberships pay ~$12 then renewals). Starter difficulty first.'],
    ['Grab one asset', 'Open the Asset Vault, filter to your campaign, download the strongest short clip or image. Check its listed rights — every asset shows what you may do with it.'],
    ['Make one vertical cut', 'Remix Studio: trim to 20–40 seconds, reframe 9:16, add subtitles, hook in the first 2 seconds, your promo code + disclosure overlay at the end.'],
    ['Copy your link and code', 'My Links → copy the tracked link for your campaign offer. Your promo code is on your Dashboard. The code is your strongest attribution — say it out loud in the video.'],
    ['Post natively', 'Upload directly in the TikTok / YouTube / Instagram app (never cross-post watermarked files). Disclosure visible IN the content and repeated in the caption. Link in bio/description/first comment per platform.'],
    ['Submit the live URL', 'Share Center → paste your live post URL + a screenshot of the analytics page within 24 hours. This is what makes your post count for rewards.'],
    ['Repeat tomorrow', 'One post per day for the first week beats seven posts on Sunday. The algorithm and the review queue both reward consistency.'],
  ]
  return (
    <div>
      <PageHeader title="48-Hour Fast Start" subtitle="Approval to first published post in one sitting. Follow it top to bottom." />
      <div className="space-y-3">
        {steps.map(([t, d], i) => (
          <Card key={t}>
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green font-extrabold text-navy">{i + 1}</span>
              <div>
                <h3 className="font-bold text-offwhite">{t}</h3>
                <p className="mt-1 text-sm text-steel-200">{d}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Section title="The required disclosure — copy it exactly">
        <Card>
          <p className="font-mono text-sm text-amber">&quot;{DISCLOSURE}&quot;</p>
          <p className="mt-2 text-sm text-steel-200">
            For video: show it early, say it out loud, repeat it in the caption. Posts without it are rejected and repeat offenses escalate.
          </p>
        </Card>
      </Section>
      <div className="mt-6 flex gap-3">
        <Link to="/creator/campaigns" className="rounded-md bg-cyan px-4 py-2 font-bold text-navy hover:opacity-90">Open Campaigns</Link>
        <Link to="/creator/playbooks" className="rounded-md border border-(--ss-line-strong) px-4 py-2 font-semibold text-offwhite hover:border-cyan">Platform Playbooks →</Link>
      </div>
    </div>
  )
}

/* ============================================================
   CREATOR /creator/playbooks — per-platform playbooks
   ============================================================ */
export function PlaybooksPage() {
  const platforms: Array<{ name: string; badge: string; link: string; cadence: string; hooks: string[]; notes: string }> = [
    {
      name: 'TikTok',
      badge: '9:16 · 15–35s',
      link: 'Link in bio (switch to a business/creator account). Say your promo code out loud — most TikTok conversions come from the code, not the link.',
      cadence: '1–2 per day. Post, watch 24h, double down on what holds viewers past 3 seconds.',
      hooks: ['“This engine runs on a gas you can make at home…”', '“Everyone thinks hydrogen is dangerous. Watch this.”', '“I turned water into fuel research — here’s the math.”'],
      notes: 'Raw, native-feeling cuts outperform polished edits. Subtitles always on. Never repost with another platform’s watermark.',
    },
    {
      name: 'YouTube Shorts',
      badge: '9:16 · up to 60s',
      link: 'Tracked link in the description AND pinned comment. Your code verbally in the video.',
      cadence: '3–5 per week, plus one longer breakdown video per month if you can — longform converts best of all.',
      hooks: ['“The Stanley Meyer circuit everyone gets wrong”', '“$49/month gets you this entire hydrogen lab…”', '“3 things nobody tells you about HHO builds”'],
      notes: 'Shorts feed discovery; the pinned comment carries the click. End every Short with the code + where to find the link.',
    },
    {
      name: 'Instagram Reels',
      badge: '9:16 · 15–30s',
      link: 'Link in bio (use a link-in-bio tool if you run multiple). Code in the caption and on-screen.',
      cadence: '1 per day. Stories with a link sticker on posting days multiply reach for free.',
      hooks: ['Before/after build shots', 'Fast-cut lab footage with a bold claim question', '“Save this if you ever wanted to build one”'],
      notes: 'Reels + a Story with a link sticker is the strongest combo. Carousel posts of build photos also convert for products.',
    },
    {
      name: 'X (Twitter)',
      badge: 'Native video + threads',
      link: 'Tracked link directly in the post or first reply. Links are allowed — use them.',
      cadence: 'Daily. One thread per week: a build story or research breakdown, link at the end.',
      hooks: ['“A thread on why hydrogen retrofits are closer than you think 🧵”', 'Hot-take quote + 30s clip', 'Progress-photo threads'],
      notes: 'Threads with the link in the final tweet outperform link-first posts. Engage replies — the algorithm rewards conversation.',
    },
    {
      name: 'Facebook',
      badge: 'Native video + groups',
      link: 'Link in the post text. In groups: give value first, link in comments if group rules require.',
      cadence: '3–4 per week on your page; daily value-posts in relevant groups (auto, DIY, energy, prepper).',
      hooks: ['Longer builds and demos (1–3 min) do well', '“Asked and answered” posts responding to common hydrogen questions'],
      notes: 'Facebook groups around trucks, fuel costs, and off-grid living are the highest-intent audiences for fuel products. Never spam — become the known expert.',
    },
    {
      name: 'Snapchat',
      badge: '9:16 · Spotlight + Stories',
      link: 'Links attach directly to Snaps (swipe-up). Code on-screen for Spotlight.',
      cadence: 'Daily Stories if Snapchat is your base; otherwise repost your TikTok cuts to Spotlight.',
      hooks: ['Fast lab clips', 'Day-in-the-life build content'],
      notes: 'Younger audience — lean education and “whoa” demos over product pitches. Spotlight is free distribution for existing vertical cuts.',
    },
  ]
  return (
    <div>
      <PageHeader title="Platform Playbooks" subtitle="Where the link goes, what hooks work, and how often to post — per platform." />
      <div className="space-y-4">
        {platforms.map((p) => (
          <Card key={p.name}>
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-lg font-bold text-cyan">{p.name}</h3>
              <Badge value={p.badge} />
            </div>
            <div className="grid gap-3 text-sm text-steel-200 md:grid-cols-2">
              <div>
                <p className="font-semibold text-offwhite">Where your link &amp; code go</p>
                <p className="mt-1">{p.link}</p>
                <p className="mt-3 font-semibold text-offwhite">Cadence</p>
                <p className="mt-1">{p.cadence}</p>
              </div>
              <div>
                <p className="font-semibold text-offwhite">Hooks that work</p>
                <ul className="mt-1 space-y-1">{p.hooks.map((h) => <li key={h}>• {h}</li>)}</ul>
                <p className="mt-3 font-semibold text-offwhite">Notes</p>
                <p className="mt-1">{p.notes}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Section title="Every platform, every post">
        <Card>
          <ul className="grid gap-2 text-sm text-steel-200 md:grid-cols-2">
            <li>• Disclosure in the content, spoken and written. No exceptions.</li>
            <li>• No income promises, no “free energy”, no guaranteed-savings claims.</li>
            <li>• Native uploads only — no cross-platform watermarks.</li>
            <li>• Submit every live URL in the Share Center within 24 hours.</li>
          </ul>
        </Card>
      </Section>
    </div>
  )
}

/* ============================================================
   CREATOR /creator/money — how the money works + first $500
   ============================================================ */
export function MoneyGuidePage() {
  return (
    <div>
      <PageHeader title="How the Money Works" subtitle="Exact math, exact timelines, and the fastest route to your first $500." />

      <Section title="One sale, worked end to end">
        <Card>
          <ol className="space-y-2 text-sm text-steel-200">
            <li><span className="font-bold text-offwhite">1.</span> Your follower joins the $49.00/month membership through your link.</li>
            <li><span className="font-bold text-offwhite">2.</span> Fees come off first — platform fee, payment processing, any tax/discount. Net collected: <span className="font-mono text-green">$42.38</span>.</li>
            <li><span className="font-bold text-offwhite">3.</span> Your first-month commission: 25% × $42.38 = <span className="font-mono text-green">$10.59</span>.</li>
            <li><span className="font-bold text-offwhite">4.</span> They stay subscribed: months 2–12 pay 15% ≈ <span className="font-mono text-green">$6.35/month</span>. One retained member ≈ <span className="font-mono text-green">$80+/year</span>.</li>
            <li><span className="font-bold text-offwhite">5.</span> Commission holds 30–45 days (up to 90 for iOS) so refunds can clear, then becomes payable.</li>
            <li><span className="font-bold text-offwhite">6.</span> Monthly payout batch: $50 minimum balance, paid via PayPal / Wise / bank transfer.</li>
          </ol>
        </Card>
      </Section>

      <Section title="Products pay faster than memberships">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <h3 className="mb-2 font-bold text-cyan">Membership ($49/mo)</h3>
            <p className="text-sm text-steel-200">~$10.59 now, then ~$6.35/month while they stay. Best long-term income; slowest first dollar.</p>
          </Card>
          <Card>
            <h3 className="mb-2 font-bold text-green">Products ($39–$79)</h3>
            <p className="text-sm text-steel-200">25% of full net price immediately — a $79 research collection pays ~$18–19 on day one. Launch campaigns pay up to 30%. Fastest first dollar.</p>
          </Card>
        </div>
      </Section>

      <Section title="Your first $500 — the stack">
        <Card>
          <ul className="space-y-2 text-sm text-steel-200">
            <li>• <span className="font-semibold text-offwhite">Content rewards land first.</span> 10 approved remixes = $50 in bonuses before a single view is counted; verified views add $1.25/1,000 (remix) or $3/1,000 (original).</li>
            <li>• <span className="font-semibold text-offwhite">Push products in week 1–2.</span> 10 product sales ≈ $130–190 in immediate commissions. Use your promo code everywhere — a redeemed code always credits you, even if the click was lost.</li>
            <li>• <span className="font-semibold text-offwhite">Memberships compound underneath.</span> 15 members recruited in month 1 ≈ $160 now + ~$95/month recurring while they stay.</li>
            <li>• <span className="font-semibold text-offwhite">Realistic total:</span> consistent daily posting across 2–3 platforms typically stacks bonuses + products + first memberships toward the $500 mark in the first payout cycles. Nothing is guaranteed — volume and hooks decide it.</li>
          </ul>
        </Card>
      </Section>

      <Section title="What kills earnings">
        <Card>
          <ul className="grid gap-2 text-sm text-steel-200 md:grid-cols-2">
            <li>• Refund-heavy traffic (commissions reverse automatically)</li>
            <li>• Bought views/bots — rewards denied, account flagged</li>
            <li>• Missing disclosure — post rejected, no reward</li>
            <li>• Self-purchases — never commissionable</li>
            <li>• Income-promise content — compliance strike</li>
            <li>• Posting without submitting the URL — untracked, unrewarded</li>
          </ul>
        </Card>
      </Section>

      <div className="mt-6 flex gap-3">
        <Link to="/creator/fast-start" className="rounded-md bg-green px-4 py-2 font-bold text-navy hover:opacity-90">Start the 48-Hour Fast Start</Link>
        <Link to="/creator/earnings" className="rounded-md border border-(--ss-line-strong) px-4 py-2 font-semibold text-offwhite hover:border-cyan">View my earnings</Link>
      </div>
    </div>
  )
}
