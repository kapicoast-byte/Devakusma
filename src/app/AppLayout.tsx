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
  ];

  const closeOnMobile = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) setOpen(false);
  };

  return (
    <div className="flex h-full bg-[var(--color-mint)]">
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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white shadow-xl transition-transform duration-200 md:static md:z-0 md:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full md:hidden'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-5 text-xl font-extrabold text-[var(--color-leaf)]">
          <span className="text-2xl">🌿</span> Devakusuma
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={closeOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition ${
                  isActive
                    ? 'bg-[var(--color-mint)] text-[var(--color-leaf)]'
                    : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              <Icon size={22} />
              <span className="flex-1">{label}</span>
              {badge ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-gray-100 p-3">
          {user?.email && (
            <div className="mb-1 truncate px-3 text-sm text-gray-500" title={user.email}>
              {user.displayName || user.email}
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <LogOut size={22} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 bg-white px-4 py-3 shadow-sm">
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Toggle menu"
            className="rounded-lg p-2 text-gray-700 transition hover:bg-gray-100"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
          <div className="flex items-center gap-2 font-bold text-gray-800">
            <span>🌿</span> Devakusuma Nursery Gardens
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
