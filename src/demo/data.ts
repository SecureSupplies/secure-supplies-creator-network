/**
 * DEMO DATA — every creator, customer, transaction, and metric in this
 * file is FICTIONAL and generated deterministically for demonstration.
 * The production build replaces this layer with Supabase queries.
 */
import { calculateCommission } from '../lib/commission/engine'
import type { OfferKind, CommissionStatus } from '../lib/commission/types'
import { calculateContentReward } from '../lib/commission/contentRewards'

// Deterministic PRNG so the demo is stable between builds.
function mulberry32(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = mulberry32(20260804)
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

export interface DemoOffer {
  id: string
  slug: string
  name: string
  kind: OfferKind
  currency: string
  listPriceMinor: number
  description: string
}

export interface DemoCampaign {
  id: string
  slug: string
  name: string
  offerId: string
  objective: string
  audience: string
  languages: string[]
  platforms: string[]
  rewardType: 'view_based' | 'flat_bonus'
  commissionLabel: string
  rewardLabel: string
  budgetTotalMinor: number
  budgetSpentMinor: number
  difficulty: 'starter' | 'intermediate' | 'advanced'
  assetCount: number
  topHooks: string[]
  requiredDisclosure: string
  prohibitedClaims: string[]
  startsAt: string
  endsAt: string | null
}

export interface DemoCreator {
  id: string
  partnerCode: string
  name: string
  handle: string
  status: 'authorized_creator' | 'producer' | 'elite_producer'
  languages: string[]
  complianceScore: number
  country: string
  joinedAt: string
}

export interface DemoAsset {
  id: string
  campaignId: string
  title: string
  mediaType: string
  language: string
  aspectRatio: string
  durationSeconds: number | null
  topic: string
  rightsStatus: string
  expiresAt: string | null
}

export interface DemoClick {
  id: string
  creatorId: string
  campaignId: string
  clickedAt: string
  platform: string
  converted: boolean
}

export interface DemoConversion {
  id: string
  externalId: string
  creatorId: string | null
  offerId: string
  source: string
  attributionMethod: string
  paymentNumber: number
  currency: string
  grossMinor: number
  ncrMinor: number
  status: 'paid' | 'refunded' | 'disputed'
  occurredAt: string
}

export interface DemoCommission {
  id: string
  conversionId: string
  creatorId: string
  entryKind: 'retail' | 'reversal' | 'adjustment'
  currency: string
  rateBps: number
  amountMinor: number
  status: CommissionStatus
  createdAt: string
}

export interface DemoSubmission {
  id: string
  creatorId: string
  campaignId: string
  platform: string
  liveUrl: string
  contentType: 'remix' | 'original'
  language: string
  status: string
  score: number | null
  qualifiedViews: number
  submittedAt: string
}

export interface DemoReward {
  id: string
  submissionId: string
  creatorId: string
  approvalBonusMinor: number
  viewRewardMinor: number
  payableMinor: number
  status: string
}

export interface DemoPayoutBatch {
  id: string
  reference: string
  currency: string
  totalMinor: number
  status: string
  itemCount: number
  createdAt: string
}

export interface DemoFlag {
  id: string
  creatorId: string
  flagType: string
  severity: string
  status: string
  createdAt: string
}

// ---------- offers ----------
export const offers: DemoOffer[] = [
  { id: 'off-1', slug: 'hot-rod-lab', name: 'Hydrogen Hot Rod Lab Membership', kind: 'monthly_membership', currency: 'USD', listPriceMinor: 4900, description: 'Monthly lab access, research feed, builder community, advanced training.' },
  { id: 'off-2', slug: 'hot-rod-lab-annual', name: 'Hot Rod Lab — Annual Membership', kind: 'annual_membership', currency: 'USD', listPriceMinor: 49900, description: 'Twelve months of lab access at annual pricing.' },
  { id: 'off-3', slug: 'coil-calculator', name: 'Stanley A. Meyer Coil Calculators', kind: 'digital_product', currency: 'USD', listPriceMinor: 5600, description: 'Research & preservation calculator collection with supporting notes.' },
  { id: 'off-4', slug: 'vic-library', name: 'VIC Research Library', kind: 'digital_product', currency: 'USD', listPriceMinor: 3900, description: 'Annotated VIC research and historical document collection.' },
  { id: 'off-5', slug: 'nano-bubble-collection', name: 'Nano-Bubble Research Collection', kind: 'launch_product', currency: 'USD', listPriceMinor: 7900, description: 'Launch-window research collection with enhanced commission.' },
  { id: 'off-6', slug: 'builder-training', name: 'Hydrogen Builder Training Videos', kind: 'digital_product', currency: 'USD', listPriceMinor: 4500, description: 'Structured build-education video series.' },
]

export const REQUIRED_DISCLOSURE =
  'Paid affiliate link — I may earn a commission if you purchase or join through this link.'

const PROHIBITED = [
  'No guaranteed fuel-savings claims',
  'No "free energy" claims',
  'No emissions or certification claims',
  'No income guarantees',
]

// ---------- campaigns ----------
export const campaigns: DemoCampaign[] = [
  {
    id: 'cmp-1', slug: 'hot-rod-lab-membership', name: 'Hydrogen Hot Rod Lab Membership', offerId: 'off-1',
    objective: 'Grow lab membership among hydrogen builders and alternative-energy communities.',
    audience: 'Hydrogen enthusiasts, mechanics, home builders', languages: ['EN', 'ES', 'DE', 'PT-BR'],
    platforms: ['YouTube', 'TikTok', 'Instagram'], rewardType: 'view_based',
    commissionLabel: '25% first month / 15% renewals', rewardLabel: '$5 + $1.25 per 1k views (cap $150)',
    budgetTotalMinor: 500000, budgetSpentMinor: 187500, difficulty: 'starter', assetCount: 24,
    topHooks: ['Most coil calculations fail before the winding even starts.', 'A preserved calculator pack for serious VIC researchers.'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-06-01', endsAt: null,
  },
  {
    id: 'cmp-2', slug: 'coil-calculators', name: 'Stanley A. Meyer Coil Calculators', offerId: 'off-3',
    objective: 'Sell the calculator research & preservation collection.',
    audience: 'VIC researchers, electronics hobbyists, coil-winding communities', languages: ['EN', 'ES', 'DE', 'PT-BR'],
    platforms: ['YouTube', 'TikTok', 'Instagram', 'Facebook'], rewardType: 'view_based',
    commissionLabel: '25% of Net Collected Revenue', rewardLabel: '$5 + $1.25 per 1k views (cap $150)',
    budgetTotalMinor: 300000, budgetSpentMinor: 96400, difficulty: 'starter', assetCount: 18,
    topHooks: ['Stop searching through disconnected Meyer diagrams.', 'What happens when one unit in a coil calculation is wrong?'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-06-15', endsAt: null,
  },
  {
    id: 'cmp-3', slug: 'vic-research-library', name: 'VIC Research Library', offerId: 'off-4',
    objective: 'Promote the annotated VIC research library to historians and researchers.',
    audience: 'Meyer researchers, historical-technology communities', languages: ['EN', 'DE'],
    platforms: ['YouTube', 'Facebook'], rewardType: 'flat_bonus',
    commissionLabel: '25% of Net Collected Revenue', rewardLabel: 'Flat $15 per approved post',
    budgetTotalMinor: 200000, budgetSpentMinor: 42000, difficulty: 'intermediate', assetCount: 14,
    topHooks: ['These historical coil formulas have now been organized into one working reference.'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-07-01', endsAt: '2026-12-31',
  },
  {
    id: 'cmp-4', slug: 'nano-bubble-launch', name: 'Nano-Bubble Research Collection', offerId: 'off-5',
    objective: 'Launch campaign with enhanced commission window.',
    audience: 'Alternative-energy researchers, automotive experimenters', languages: ['EN', 'PT-BR'],
    platforms: ['YouTube', 'Instagram', 'X'], rewardType: 'view_based',
    commissionLabel: 'Up to 30% (launch window)', rewardLabel: '$20 + $3 per 1k views for original UGC (cap $400)',
    budgetTotalMinor: 250000, budgetSpentMinor: 61300, difficulty: 'intermediate', assetCount: 16,
    topHooks: ['Builders asked for a repeatable calculation process. This is the organized version.'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-07-15', endsAt: '2026-09-15',
  },
  {
    id: 'cmp-5', slug: 'builder-training-videos', name: 'Hydrogen Builder Training Videos', offerId: 'off-6',
    objective: 'Promote build-education videos to maker communities.',
    audience: 'Makers, machinists, fabrication communities', languages: ['EN', 'ES'],
    platforms: ['YouTube', 'TikTok'], rewardType: 'view_based',
    commissionLabel: '25% of Net Collected Revenue', rewardLabel: '$5 + $1.25 per 1k views (cap $150)',
    budgetTotalMinor: 150000, budgetSpentMinor: 23800, difficulty: 'starter', assetCount: 15,
    topHooks: ['A structured build-education path — safety first, hype never.'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-07-01', endsAt: null,
  },
  {
    id: 'cmp-6', slug: 'multilingual-translation', name: 'Multilingual Research Translation Campaign', offerId: 'off-1',
    objective: 'Translate approved research content into ES, DE, and PT-BR.',
    audience: 'Bilingual creators with technical vocabulary', languages: ['ES', 'DE', 'PT-BR'],
    platforms: ['YouTube', 'TikTok', 'Instagram'], rewardType: 'flat_bonus',
    commissionLabel: '25% first month / 15% renewals', rewardLabel: 'Translation bonus $25 per approved language version',
    budgetTotalMinor: 100000, budgetSpentMinor: 18500, difficulty: 'advanced', assetCount: 13,
    topHooks: ['Bring the research library to your language community.'],
    requiredDisclosure: REQUIRED_DISCLOSURE, prohibitedClaims: PROHIBITED,
    startsAt: '2026-07-01', endsAt: null,
  },
]

// ---------- creators (20, fictional) ----------
const firstNames = ['Marco', 'Lena', 'Tobias', 'Ana', 'Rafael', 'Ingrid', 'Carlos', 'Petra', 'Lucas', 'María', 'Jonas', 'Beatriz', 'Felix', 'Sofia', 'Diego', 'Clara', 'Bruno', 'Elena', 'Otto', 'Camila']
const lastInitials = ['V.', 'K.', 'M.', 'S.', 'R.', 'B.', 'T.', 'H.', 'F.', 'G.']
const countries = ['US', 'BR', 'DE', 'ES', 'MX', 'AU', 'PT', 'AR', 'AT', 'CA']
const langSets = [['EN'], ['EN', 'ES'], ['EN', 'DE'], ['EN', 'PT-BR'], ['ES'], ['DE'], ['PT-BR'], ['EN', 'ES', 'PT-BR']]

export const creators: DemoCreator[] = Array.from({ length: 20 }, (_, i) => {
  const name = `${firstNames[i]} ${pick(lastInitials)}`
  const statuses = ['authorized_creator', 'authorized_creator', 'authorized_creator', 'producer', 'producer', 'elite_producer'] as const
  return {
    id: `cr-${i + 1}`,
    partnerCode: `SS${String(i + 1).padStart(2, '0')}${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(75 + (i % 12))}`,
    name,
    handle: `@${firstNames[i].toLowerCase()}_h2lab`,
    status: statuses[i % statuses.length],
    languages: langSets[i % langSets.length],
    complianceScore: randInt(88, 100),
    country: countries[i % countries.length],
    joinedAt: `2026-0${randInt(3, 7)}-${String(randInt(1, 28)).padStart(2, '0')}`,
  }
})

// ---------- assets (100) ----------
const assetTopics = ['Hydrogen', 'Stanley Meyer', 'VIC', 'Coils', 'Nano-bubble research', 'Electronics', '3D printing', 'Build logs']
const mediaTypes = ['mp4', 'mp4', 'mp4', 'png', 'jpg', 'pdf', 'zip', 'srt']
const ratios = ['9:16', '1:1', '16:9']
export const assets: DemoAsset[] = Array.from({ length: 100 }, (_, i) => {
  const campaign = campaigns[i % campaigns.length]
  const mediaType = pick(mediaTypes)
  return {
    id: `as-${i + 1}`,
    campaignId: campaign.id,
    title: `${pick(assetTopics)} — segment ${i + 1}`,
    mediaType,
    language: pick(campaign.languages),
    aspectRatio: mediaType === 'mp4' ? pick(ratios) : 'other',
    durationSeconds: mediaType === 'mp4' ? randInt(12, 240) : null,
    topic: pick(assetTopics),
    rightsStatus: pick(['owned', 'owned', 'owned', 'cleared_promotional']),
    expiresAt: rand() > 0.8 ? '2026-12-31' : null,
  }
})

// ---------- clicks (250) ----------
const platforms = ['YouTube', 'TikTok', 'Instagram', 'Facebook', 'X']
export const clicks: DemoClick[] = Array.from({ length: 250 }, (_, i) => ({
  id: `ck-${i + 1}`,
  creatorId: creators[i % creators.length].id,
  campaignId: campaigns[i % campaigns.length].id,
  clickedAt: `2026-07-${String(randInt(1, 31)).padStart(2, '0')}T${String(randInt(0, 23)).padStart(2, '0')}:00:00Z`,
  platform: pick(platforms),
  converted: i % 8 === 0,
}))

// ---------- conversions (30) + commissions (40) ----------
const feeFor = (gross: number) => ({
  platformFeeMinor: Math.floor(gross * 0.1),
  processingFeeMinor: Math.floor(gross * 0.029) + 30,
})

export const conversions: DemoConversion[] = []
export const commissions: DemoCommission[] = []

let commissionSeq = 0
for (let i = 0; i < 30; i++) {
  const offer = offers[i % offers.length]
  const creator = creators[i % 12]
  const fees = feeFor(offer.listPriceMinor)
  const status = i % 10 === 9 ? 'refunded' : 'paid'
  const paymentNumber = offer.kind === 'monthly_membership' ? randInt(1, 6) : 1
  const money = {
    currency: offer.currency,
    grossAmountMinor: offer.listPriceMinor,
    taxAmountMinor: 0,
    discountAmountMinor: 0,
    ...fees,
    refundAmountMinor: 0,
    chargebackAmountMinor: 0,
    fxFeeMinor: 0,
    payoutFeeMinor: 0,
  }
  const result = calculateCommission({
    conversionId: `cv-${i + 1}`,
    offerKind: offer.kind,
    paymentNumber,
    money,
    attributionMethod: i % 3 === 0 ? 'promo_code' : 'tracked_click',
    isSelfReferral: false,
    campaignBpsOverride: offer.kind === 'launch_product' ? 3000 : undefined,
  })
  const occurredAt = `2026-07-${String(randInt(1, 31)).padStart(2, '0')}`
  conversions.push({
    id: `cv-${i + 1}`,
    externalId: `DEMO-TXN-${1000 + i}`,
    creatorId: creator.id,
    offerId: offer.id,
    source: offer.kind.includes('membership') ? 'patreon_membership' : 'patreon_shop_import',
    attributionMethod: i % 3 === 0 ? 'promo_code' : 'tracked_click',
    paymentNumber,
    currency: offer.currency,
    grossMinor: offer.listPriceMinor,
    ncrMinor: result.netCollectedRevenueMinor,
    status,
    occurredAt,
  })
  if (result.commissionAmountMinor > 0) {
    commissionSeq += 1
    const statuses: CommissionStatus[] = ['paid', 'payable', 'held', 'approved', 'held']
    commissions.push({
      id: `cm-${commissionSeq}`,
      conversionId: `cv-${i + 1}`,
      creatorId: creator.id,
      entryKind: 'retail',
      currency: result.currency,
      rateBps: result.rateBps,
      amountMinor: result.commissionAmountMinor,
      status: status === 'refunded' ? 'reversed' : statuses[i % statuses.length],
      createdAt: occurredAt,
    })
    if (status === 'refunded') {
      commissionSeq += 1
      commissions.push({
        id: `cm-${commissionSeq}`,
        conversionId: `cv-${i + 1}`,
        creatorId: creator.id,
        entryKind: 'reversal',
        currency: result.currency,
        rateBps: result.rateBps,
        amountMinor: -result.commissionAmountMinor,
        status: 'reversed',
        createdAt: occurredAt,
      })
    }
  }
}
// Top up to 40 commission entries with renewals for the most active creators.
while (commissions.length < 40) {
  commissionSeq += 1
  const creator = creators[commissionSeq % 8]
  const money = {
    currency: 'USD',
    grossAmountMinor: 4900,
    taxAmountMinor: 0,
    discountAmountMinor: 0,
    ...feeFor(4900),
    refundAmountMinor: 0,
    chargebackAmountMinor: 0,
    fxFeeMinor: 0,
    payoutFeeMinor: 0,
  }
  const r = calculateCommission({
    conversionId: `cv-r-${commissionSeq}`,
    offerKind: 'monthly_membership',
    paymentNumber: randInt(2, 12),
    money,
    attributionMethod: 'tracked_click',
    isSelfReferral: false,
  })
  commissions.push({
    id: `cm-${commissionSeq}`,
    conversionId: conversions[commissionSeq % conversions.length].id,
    creatorId: creator.id,
    entryKind: 'retail',
    currency: 'USD',
    rateBps: r.rateBps,
    amountMinor: r.commissionAmountMinor,
    status: (['paid', 'payable', 'held'] as CommissionStatus[])[commissionSeq % 3],
    createdAt: `2026-07-${String(randInt(1, 31)).padStart(2, '0')}`,
  })
}

// ---------- submissions (20) + rewards (12) ----------
const subStatuses = ['approved', 'approved', 'published', 'under_review', 'submitted', 'changes_requested', 'reward_approved', 'rejected']
export const submissions: DemoSubmission[] = Array.from({ length: 20 }, (_, i) => {
  const creator = creators[i % 10]
  const campaign = campaigns[i % campaigns.length]
  return {
    id: `sb-${i + 1}`,
    creatorId: creator.id,
    campaignId: campaign.id,
    platform: pick(platforms),
    liveUrl: `https://example.com/demo-post/${creator.partnerCode.toLowerCase()}-${i + 1}`,
    contentType: i % 3 === 0 ? 'original' : 'remix',
    language: pick(campaign.languages),
    status: subStatuses[i % subStatuses.length],
    score: i % 4 === 0 ? null : randInt(62, 98),
    qualifiedViews: randInt(400, 180000),
    submittedAt: `2026-07-${String(randInt(1, 31)).padStart(2, '0')}`,
  }
})

export const rewards: DemoReward[] = submissions
  .filter((s) => ['approved', 'published', 'reward_approved'].includes(s.status))
  .slice(0, 12)
  .map((s, i) => {
    const r = calculateContentReward({
      contentType: s.contentType,
      approved: true,
      qualifiedViews: s.qualifiedViews,
      campaignBudgetRemainingMinor: 10_000_00,
    })
    return {
      id: `rw-${i + 1}`,
      submissionId: s.id,
      creatorId: s.creatorId,
      approvalBonusMinor: r.approvalBonusMinor,
      viewRewardMinor: r.viewRewardMinor,
      payableMinor: r.payableMinor,
      status: i % 3 === 0 ? 'paid' : i % 3 === 1 ? 'payable' : 'held',
    }
  })

// ---------- payout batches (2) ----------
export const payoutBatches: DemoPayoutBatch[] = [
  { id: 'pb-1', reference: 'DEMO-BATCH-2026-06', currency: 'USD', totalMinor: 128740, status: 'paid', itemCount: 7, createdAt: '2026-07-01' },
  { id: 'pb-2', reference: 'DEMO-BATCH-2026-07', currency: 'USD', totalMinor: 96215, status: 'under_review', itemCount: 9, createdAt: '2026-08-01' },
]

// ---------- compliance flags (8) ----------
const flagTypes = ['missing_disclosure', 'earn_per_day', 'free_energy', 'duplicate_published_url', 'suspicious_view_growth', 'self_referral', 'guaranteed', 'promotion_code_misuse']
export const flags: DemoFlag[] = flagTypes.map((t, i) => ({
  id: `fl-${i + 1}`,
  creatorId: creators[randInt(0, 19)].id,
  flagType: t,
  severity: i < 2 ? 'review' : i < 5 ? 'serious' : 'review',
  status: pick(['open', 'reviewing', 'resolved']),
  createdAt: `2026-07-${String(randInt(1, 31)).padStart(2, '0')}`,
}))

// ---------- aggregates ----------
export const demoCreatorId = 'cr-1' // the "logged in" creator in demo mode

export function creatorById(id: string): DemoCreator | undefined {
  return creators.find((c) => c.id === id)
}
export function campaignById(id: string): DemoCampaign | undefined {
  return campaigns.find((c) => c.id === id)
}
export function offerById(id: string): DemoOffer | undefined {
  return offers.find((o) => o.id === id)
}

export function creatorEarnings(creatorId: string) {
  const mine = commissions.filter((c) => c.creatorId === creatorId)
  const myRewards = rewards.filter((r) => r.creatorId === creatorId)
  const sum = (statuses: string[]) =>
    mine.filter((c) => statuses.includes(c.status)).reduce((a, c) => a + c.amountMinor, 0) +
    myRewards.filter((r) => statuses.includes(r.status)).reduce((a, r) => a + r.payableMinor, 0)
  return {
    estimated: sum(['estimated', 'attributed', 'pending_payment']),
    held: sum(['held']),
    payable: sum(['payable', 'approved']),
    paid: sum(['paid']),
  }
}
