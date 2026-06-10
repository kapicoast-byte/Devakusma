import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, PlusCircle, ReceiptText, IndianRupee, BarChart3, AlertTriangle, LogOut } from 'lucide-react';
import { useData } from '@/state/DataProvider';

interface Tile {
  to: string;
  label: string;
  icon: ReactNode;
}

const TILES: Tile[] = [
  { to: '/plants', label: 'Plants Available', icon: <Leaf size={40} /> },
  { to: '/add', label: 'Add Plants', icon: <PlusCircle size={40} /> },
  { to: '/bill', label: 'Create Bill', icon: <ReceiptText size={40} /> },
  { to: '/value', label: 'Stock Value', icon: <IndianRupee size={40} /> },
  { to: '/dashboard', label: 'Owner Dashboard', icon: <BarChart3 size={40} /> },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { lowStock, configured, user, signOut } = useData();

  return (
    <div className="min-h-full bg-[var(--color-mint)] pb-10">
      <header className="flex items-center justify-between bg-[var(--color-leaf)] px-5 py-6 text-white shadow">
        <div className="flex items-center gap-2 text-2xl font-extrabold">
          <span>🌿</span>
          <span>Devakusuma Nursery</span>
        </div>
        {user && (
          <button
            onClick={() => signOut()}
            aria-label="Sign out"
            title={`Sign out (${user.displayName ?? user.email ?? ''})`}
            className="rounded-full p-2 hover:bg-white/15"
          >
            <LogOut size={22} />
          </button>
        )}
      </header>

      <main className="mx-auto max-w-xl px-4 py-5">
        {!configured && (
          <div className="mb-4 rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900">
            Firebase isn't connected yet. Copy <code>.env.example</code> to <code>.env</code> and
            add your Firebase keys to start saving data.
          </div>
        )}

        {/* Module 10 — Low Stock Alert banner */}
        {lowStock.length > 0 && (
          <button
            onClick={() => navigate('/plants')}
            className="mb-5 flex w-full items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-left text-red-800"
          >
            <AlertTriangle className="mt-1 shrink-0" />
            <div>
              <div className="font-bold">⚠️ Low Stock Alert ({lowStock.length})</div>
              <ul className="mt-1 text-base">
                {lowStock.slice(0, 3).map((p) => (
                  <li key={p.id}>
                    {p.plantName} — {p.size}: {p.quantity} left
                  </li>
                ))}
                {lowStock.length > 3 && <li>…and {lowStock.length - 3} more</li>}
              </ul>
            </div>
          </button>
        )}

        {/* Module 1 — 6 large icon buttons */}
        <div className="grid grid-cols-2 gap-4">
          {TILES.map((t) => (
            <button
              key={t.to}
              onClick={() => navigate(t.to)}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border-2 border-[var(--color-mint-border)] bg-white p-4 text-center shadow-sm transition active:scale-[0.97]"
            >
              <span className="text-[var(--color-leaf)]">{t.icon}</span>
              <span className="text-lg font-bold leading-tight text-gray-800">{t.label}</span>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
