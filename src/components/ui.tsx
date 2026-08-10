import type { ReactNode } from 'react'
import { formatMinor } from '../lib/money'

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-offwhite">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-steel-200">{subtitle}</p>}
      </div>
      {actions}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`ss-card p-5 ${className}`}>{children}</div>
}

export function StatTile({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'good' | 'warn' }) {
  const color = tone === 'good' ? 'text-green' : tone === 'warn' ? 'text-amber' : 'text-cyan'
  return (
    <div className="ss-card p-4">
      <div className="text-[0.68rem] font-semibold uppercase tracking-widest text-steel-300">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-steel-300">{hint}</div>}
    </div>
  )
}

const badgeTones: Record<string, string> = {
  paid: 'bg-green/15 text-green',
  payable: 'bg-cyan/15 text-cyan',
  approved: 'bg-cyan/15 text-cyan',
  reward_approved: 'bg-cyan/15 text-cyan',
  published: 'bg-green/15 text-green',
  held: 'bg-amber/15 text-amber',
  under_review: 'bg-amber/15 text-amber',
  submitted: 'bg-amber/15 text-amber',
  reviewing: 'bg-amber/15 text-amber',
  pending: 'bg-amber/15 text-amber',
  changes_requested: 'bg-amber/15 text-amber',
  draft: 'bg-steel/40 text-steel-200',
  open: 'bg-red/15 text-red',
  reversed: 'bg-red/15 text-red',
  rejected: 'bg-red/15 text-red',
  refunded: 'bg-red/15 text-red',
  disputed: 'bg-red/15 text-red',
  serious: 'bg-red/15 text-red',
  critical: 'bg-red/25 text-red',
  review: 'bg-amber/15 text-amber',
  resolved: 'bg-green/15 text-green',
  estimated: 'bg-steel/40 text-steel-200',
}

export function Badge({ value }: { value: string }) {
  const tone = badgeTones[value] ?? 'bg-steel/40 text-steel-200'
  return <span className={`ss-chip ${tone}`}>{value.replace(/_/g, ' ')}</span>
}

export function Money({ minor, currency = 'USD' }: { minor: number; currency?: string }) {
  return <span className={`font-mono ${minor < 0 ? 'text-red' : ''}`}>{formatMinor(minor, currency)}</span>
}

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
}

export function DataTable<T extends { id: string }>({ columns, rows, emptyMessage = 'No records yet.' }: { columns: Column<T>[]; rows: T[]; emptyMessage?: string }) {
  if (rows.length === 0) return <EmptyState message={emptyMessage} />
  return (
    <div className="ss-card overflow-x-auto">
      <table className="ss-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} scope="col">{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((c) => (
                <td key={c.key}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="ss-card flex flex-col items-center gap-2 p-10 text-center">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="16" fill="none" stroke="var(--ss-steel-300)" strokeWidth="2" strokeDasharray="4 4" />
      </svg>
      <p className="text-sm text-steel-200">{message}</p>
    </div>
  )
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-steel-300">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-navy-700" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-2 rounded-full bg-cyan" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-steel-300">{title}</h2>
      {children}
    </section>
  )
}
