import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  LayoutDashboard,
  Leaf,
  ReceiptText,
  FileText,
  IndianRupee,
  Wallet,
  Users,
  Store,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useData } from '@/state/DataProvider';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: number;
}

/** Professional app shell: collapsible sidebar + top bar + routed content. */
export default function AppLayout() {
  // Open by default on desktop, closed on mobile.
  const [open, setOpen] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 768,
  );
  const { user, signOut, lowStock } = useData();

  const nav: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/inventory', label: 'Inventory', icon: Leaf, badge: lowStock.length },
    { to: '/bill', label: 'Create Bill', icon: ReceiptText },
    { to: '/bills', label: 'Bills', icon: FileText },
    { to: '/value', label: 'Stock Value', icon: IndianRupee },
    { to: '/accounts', label: 'Accounts', icon: Wallet },
    { to: '/customers', label: 'Customers', icon: Users },
    { to: '/profile', label: 'Company Profile', icon: Store },
  ];

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setOpen(false);
  };

  return (
    <div className="flex h-full bg-[var(--bg)]">
      {/* Backdrop for mobile drawer */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-[var(--border)] bg-white shadow-xl transition-transform duration-200 md:static md:z-0 md:border-r md:shadow-[var(--shadow-soft)] ${
          open ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg text-white shadow-[var(--shadow-soft)]"
            style={{ background: 'var(--gold-grad)' }}
          >
            🌿
          </span>
          <div className="leading-tight">
            <div className="text-base font-bold text-gray-900">Devakusuma</div>
            <div className="text-xs text-gray-500">Nursery Gardens</div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium transition ${
                  isActive
                    ? 'bg-[var(--color-mint)] text-[var(--color-leaf)]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <Icon size={20} />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-[var(--border)] p-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-mint)] text-sm font-bold text-[var(--color-leaf)]">
              {(user?.displayName || user?.email || '?').charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-gray-800">
                {user?.displayName || 'Signed in'}
              </div>
              {user?.email && (
                <div className="truncate text-xs text-gray-500" title={user.email}>
                  {user.email}
                </div>
              )}
            </div>
            <button
              onClick={() => signOut()}
              aria-label="Sign out"
              title="Sign out"
              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-red-600"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-[var(--border)] bg-white px-4 py-3">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2 font-semibold text-gray-900">
            Devakusuma Nursery Gardens
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
