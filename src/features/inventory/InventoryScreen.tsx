import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { Screen, Card, Modal } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { searchPlants, formatRupees } from '@/lib/logic';
import AddStockForm from './AddStockForm';
import type { Plant } from '@/types';

/** Inventory module — list/search all plants, add stock, and quick-add per entry. */
export default function InventoryScreen() {
  const { plants, loading } = useData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [quickAdd, setQuickAdd] = useState<Plant | null>(null);

  // Allow deep-linking to the Add Stock dialog (e.g. from the dashboard).
  useEffect(() => {
    if (params.get('add')) {
      setShowAdd(true);
      params.delete('add');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const results = useMemo(() => searchPlants(plants, q), [plants, q]);

  return (
    <Screen
      title="Inventory"
      subtitle={`${plants.length} item${plants.length === 1 ? '' : 's'}`}
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-leaf)] px-4 py-2 font-bold text-white shadow-md transition active:scale-[0.98]"
        >
          <Plus size={18} /> Add Stock
        </button>
      }
    >
      <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-[var(--color-mint-border)] bg-white px-3">
        <Search className="text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or size…"
          className="w-full py-3 text-lg outline-none"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : results.length === 0 ? (
        <p className="text-center text-gray-500">
          {plants.length === 0 ? 'No plants yet. Tap “Add Stock” to begin.' : 'No plants found.'}
        </p>
      ) : (
        <ul className="space-y-3">
          {results.map((p) => {
            const low = p.quantity < p.minThreshold;
            return (
              <li key={p.id}>
                <Card className={low ? 'border-red-300' : ''}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-lg font-bold text-gray-800">{p.plantName}</div>
                      <div className="text-gray-500">{p.size}</div>
                      {low && (
                        <div className="mt-1 text-sm font-semibold text-red-600">
                          ⚠️ Low stock (below {p.minThreshold})
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`text-xl font-extrabold ${
                            low ? 'text-red-600' : 'text-[var(--color-leaf)]'
                          }`}
                        >
                          {p.quantity}
                        </div>
                        <div className="text-sm text-gray-500">{formatRupees(p.sellingPrice)}</div>
                      </div>
                      <button
                        onClick={() => setQuickAdd(p)}
                        aria-label={`Add stock to ${p.plantName} ${p.size}`}
                        className="flex items-center gap-1 rounded-xl border-2 border-[var(--color-leaf)] px-3 py-2 font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]"
                      >
                        <Plus size={18} /> Add
                      </button>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && (
        <Modal title="Add Stock" onClose={() => setShowAdd(false)}>
          <AddStockForm onDone={() => setShowAdd(false)} />
        </Modal>
      )}
      {quickAdd && (
        <Modal title="Add Stock" onClose={() => setQuickAdd(null)}>
          <AddStockForm
            lockTo={{
              plantName: quickAdd.plantName,
              size: quickAdd.size,
              sellingPrice: quickAdd.sellingPrice,
              quantity: quickAdd.quantity,
            }}
            onDone={() => setQuickAdd(null)}
          />
        </Modal>
      )}
    </Screen>
  );
}
