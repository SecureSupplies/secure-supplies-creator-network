import { NavLink, Outlet, Link } from 'react-router-dom'
import { Wordmark } from './Wordmark'
import { useDemo, type Role } from '../demo/DemoContext'

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 bg-amber px-3 py-1.5 text-center text-xs font-bold tracking-wider text-navy">
      DEMO DATA — all creators, customers, transactions, and metrics shown are fictional
    </div>
  )
}

export function RoleSwitcher() {
  const { role, setRole } = useDemo()
  const roles: Array<{ id: Role; label: string }> = [
    { id: 'visitor', label: 'Visitor' },
    { id: 'creator', label: 'Creator' },
    { id: 'admin', label: 'Admin' },
  ]
  return (
    <div className="flex items-center gap-1 rounded-full border border-(--ss-line-strong) p-1" role="group" aria-label="Demo role switcher">
      {roles.map((r) => (
        <button
          key={r.id}
          onClick={() => setRole(r.id)}
          aria-pressed={role === r.id}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            role === r.id ? 'bg-cyan text-navy' : 'text-steel-200 hover:text-offwhite'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-(--ss-line) px-6 py-8 text-center text-xs text-steel-300">
      <p className="mb-2">
        Earnings are not guaranteed. All hydrogen and experimental-technology content is educational
        and research based. No compensation is paid merely for recruiting another creator.
      </p>
      <p>© 2026 Daniel Donatelli / Donatelli LLC d/b/a Secure Supplies Group. All rights reserved.</p>
    </footer>
  )
}

const publicLinks = [
  { to: '/', label: 'Home' },
  { to: '/how-it-works', label: 'How It Works' },
  { to: '/offers', label: 'Offers' },
  { to: '/campaigns', label: 'Campaigns' },
  { to: '/apply', label: 'Apply' },
  { to: '/earn', label: 'Earn' },
]

export function PublicLayout() {
  const { role } = useDemo()
  return (
    <div className="ss-grid-bg min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <DemoBanner />
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-(--ss-line) px-6 py-4">
        <Link to="/" aria-label="Secure Supplies home"><Wordmark /></Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
          {publicLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === '/'}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-navy-700 text-cyan' : 'text-steel-200 hover:text-offwhite'}`
              }
            >
              {l.label}
            </NavLink>
          ))}
          {role === 'creator' && (
            <NavLink to="/creator/dashboard" className="rounded-md px-3 py-1.5 text-sm font-medium text-green">Creator Portal</NavLink>
          )}
          {role === 'admin' && (
            <NavLink to="/admin/dashboard" className="rounded-md px-3 py-1.5 text-sm font-medium text-amber">Admin Portal</NavLink>
          )}
          <NavLink to="/login" className="ml-2 rounded-md border border-cyan px-3 py-1.5 text-sm font-semibold text-cyan hover:bg-cyan hover:text-navy">Log in</NavLink>
        </nav>
        <RoleSwitcher />
      </header>
      <main id="main" className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

function PortalShell({ title, links, tone }: { title: string; links: Array<{ to: string; label: string }>; tone: string }) {
  return (
    <div className="min-h-screen">
      <a href="#main" className="skip-link">Skip to main content</a>
      <DemoBanner />
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-(--ss-line) bg-navy-800 md:w-60 md:border-b-0 md:border-r" aria-label={`${title} navigation`}>
          <div className="p-4"><Link to="/"><Wordmark height={28} /></Link></div>
          <div className={`px-4 pb-2 text-[0.65rem] font-bold uppercase tracking-widest ${tone}`}>{title}</div>
          <nav className="flex flex-row flex-wrap gap-1 p-2 md:flex-col">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-1.5 text-sm ${isActive ? 'bg-navy-700 font-semibold text-cyan' : 'text-steel-200 hover:bg-navy-700 hover:text-offwhite'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-4"><RoleSwitcher /></div>
        </aside>
        <main id="main" className="ss-grid-bg flex-1 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

const creatorLinks = [
  { to: '/creator/dashboard', label: 'Dashboard' },
  { to: '/creator/campaigns', label: 'Campaigns' },
  { to: '/creator/assets', label: 'Asset Vault' },
  { to: '/creator/remix', label: 'Remix Studio' },
  { to: '/creator/links', label: 'My Links' },
  { to: '/creator/share', label: 'Share Center' },
  { to: '/creator/submissions', label: 'Submissions' },
  { to: '/creator/earnings', label: 'Earnings' },
  { to: '/creator/payouts', label: 'Payouts' },
  { to: '/creator/academy', label: 'Academy' },
  { to: '/creator/fast-start', label: 'Fast Start' },
  { to: '/creator/playbooks', label: 'Playbooks' },
  { to: '/creator/money', label: 'Money Guide' },
  { to: '/creator/compliance', label: 'Compliance' },
  { to: '/creator/profile', label: 'Profile' },
]

export function CreatorLayout() {
  return <PortalShell title="Creator Command Center" links={creatorLinks} tone="text-green" />
}

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/applications', label: 'Applications' },
  { to: '/admin/creators', label: 'Creators' },
  { to: '/admin/offers', label: 'Offers' },
  { to: '/admin/commission-rules', label: 'Commission Rules' },
  { to: '/admin/campaigns', label: 'Campaigns' },
  { to: '/admin/assets', label: 'Assets' },
  { to: '/admin/submissions', label: 'Submissions' },
  { to: '/admin/conversions', label: 'Conversions' },
  { to: '/admin/commissions', label: 'Commissions' },
  { to: '/admin/payouts', label: 'Payouts' },
  { to: '/admin/imports', label: 'Imports' },
  { to: '/admin/discount-codes', label: 'Discount Codes' },
  { to: '/admin/fraud', label: 'Fraud' },
  { to: '/admin/compliance', label: 'Compliance' },
  { to: '/admin/audit', label: 'Audit Log' },
  { to: '/admin/settings', label: 'Settings' },
]

export function AdminLayout() {
  return <PortalShell title="Administration" links={adminLinks} tone="text-amber" />
}
