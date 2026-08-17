import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdmin } from '../config'

const navItems = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/sales-log', label: 'Sales Log' },
  { to: '/admin/products', label: 'Products', admin: true },
  { to: '/admin/discounts', label: 'Discounts', admin: true },
  { to: '/admin/qr', label: 'QR Manager', admin: true },
  { to: '/admin/cash-sales', label: 'Cash Sales', admin: true },
  { to: '/admin/assistant', label: 'Assistant', admin: true },
  { to: '/admin/event-archive', label: 'Event Archive', admin: true },
  { to: '/admin/expenses', label: 'Expenses', admin: true },
]

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { session } = useAuth()
  const admin = isAdmin(session?.user.email)

  return (
    <>
      {navItems
        .filter((item) => !item.admin || admin)
        .map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-secondary'
                  : 'text-secondary/80 hover:bg-[#242424] hover:text-secondary'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
    </>
  )
}

export default function Layout() {
  const { session, signOut } = useAuth()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-tertiary text-secondary flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-tertiary z-30">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden text-secondary p-1"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
            </svg>
          </button>
          <Link to="/" className="font-bold text-lg text-primary hover:text-primary-hover transition-colors">
            Smirk Living
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-disabled">{session?.user.email}</span>
          <button
            onClick={signOut}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-[#242424] transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        <nav className="hidden md:flex flex-col gap-1 w-56 shrink-0 border-r border-border p-3">
          <NavLinks />
        </nav>

        {drawerOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
            <nav className="absolute left-0 top-0 bottom-0 w-64 bg-tertiary border-r border-border p-3 flex flex-col gap-1">
              <div className="flex justify-between items-center mb-2 px-1">
                <span className="font-bold text-primary">Menu</span>
                <button onClick={() => setDrawerOpen(false)} className="text-secondary p-1" aria-label="Close menu">
                  ✕
                </button>
              </div>
              <NavLinks onNavigate={() => setDrawerOpen(false)} />
            </nav>
          </div>
        )}

        <main className="flex-1 min-w-0 p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
