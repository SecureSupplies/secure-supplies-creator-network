/**
 * Compliance text scanning.
 * Flags trigger human review — they are never automatic legal conclusions.
 */

export const REQUIRED_DISCLOSURE =
  'Paid affiliate link — I may earn a commission if you purchase or join through this link.'

export const PROHIBITED_PATTERNS: Array<{ id: string; pattern: RegExp; label: string }> = [
  { id: 'guaranteed', pattern: /\bguaranteed?\b/i, label: 'Guarantee language' },
  { id: 'passive_income', pattern: /passive\s+income/i, label: 'Passive-income promise' },
  { id: 'free_energy', pattern: /free\s+energy/i, label: 'Free-energy claim' },
  { id: 'fuel_savings', pattern: /proven\s+fuel\s+savings?/i, label: 'Unsupported fuel-savings claim' },
  { id: 'zero_emissions', pattern: /zero\s+emissions?/i, label: 'Unsupported emissions claim' },
  { id: 'gov_approved', pattern: /government\s+approved/i, label: 'Unsupported certification claim' },
  { id: 'risk_free', pattern: /risk[\s-]?free/i, label: 'Risk-free claim' },
  { id: 'guaranteed_results', pattern: /guaranteed\s+results?/i, label: 'Guaranteed-results claim' },
  { id: 'earn_per_day', pattern: /earn\s+\$?\d+[\d,.]*\s*(per|a|\/)\s*(day|week|month)/i, label: 'Specific earnings claim' },
  { id: 'recruit_earn', pattern: /recruit\s+(and|&|to)\s+earn/i, label: 'Recruitment-compensation language' },
]

export interface ComplianceFlagHit {
  id: string
  label: string
  match: string
}

export function scanText(text: string): ComplianceFlagHit[] {
  const hits: ComplianceFlagHit[] = []
  for (const rule of PROHIBITED_PATTERNS) {
    const m = text.match(rule.pattern)
    if (m) hits.push({ id: rule.id, label: rule.label, match: m[0] })
  }
  return hits
}

export function hasDisclosure(text: string): boolean {
  return /paid affiliate link/i.test(text) && /commission/i.test(text)
}
