import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Plus, Upload, Trash2 } from 'lucide-react';
import { Screen, Card, Modal, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { searchPlants, formatRupees, groupByPlant } from '@/lib/logic';
import { deletePlant } from '@/lib/repository';
import AddStockForm from './AddStockForm';
import BulkUpload from './BulkUpload';
import type { Plant } from '@/types';

/** Inventory module — list/search all plants, add stock, and quick-add per entry. */
export default function InventoryScreen() {
  const { plants, loading } = useData();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [quickAdd, setQuickAdd] = useState<Plant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Plant | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletePlant(confirmDelete.id);
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  }

  // Allow deep-linking to the Add Stock dialog (e.g. from the dashboard).
  useEffect(() => {
    if (params.get('add')) {
      setShowAdd(true);
      params.delete('add');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => groupByPlant(searchPlants(plants, q)), [plants, q]);

  return (
    <Screen
      title="Inventory"
      subtitle={`${plants.length} item${plants.length === 1 ? '' : 's'}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport(true)}
            aria-label="Bulk upload from Excel"
            className="flex items-center gap-2 rounded-xl border-2 border-[var(--color-leaf)] px-3 py-2 font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]"
          >
            <Upload size={18} />
            <span className="hidden sm:inline">Import</span>
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-leaf)] px-4 py-2 font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            <Plus size={18} /> Add Stock
          </button>
        </div>
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
      ) : groups.length === 0 ? (
        <p className="text-center text-gray-500">
          {plants.length === 0 ? 'No plants yet. Tap “Add Stock” to begin.' : 'No plants found.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => (
            <li key={g.plantName}>
              <Card className="!p-0 overflow-hidden">
                {/* Plant header */}
                <div className="flex items-center justify-between bg-[var(--color-mint)] px-4 py-3">
                  <div className="text-lg font-bold text-gray-800">{g.plantName}</div>
                  <div className="text-sm font-semibold text-gray-600">
                    {g.totalQuantity} in stock · {g.variants.length} size
                    {g.variants.length === 1 ? '' : 's'}
                  </div>
                </div>

                {/* Size variants */}
                <ul className="divide-y divide-gray-100">
                  {g.variants.map((v) => {
                    const low = v.quantity < v.minThreshold;
                    return (
                      <li key={v.id} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-gray-100 px-2.5 py-1 font-semibold text-gray-700">
                            {v.size}
                          </span>
                          <span className="text-gray-500">{formatRupees(v.sellingPrice)}</span>
                          {low && (
                            <span className="text-sm font-semibold text-red-600">⚠️ Low</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`text-lg font-extrabold ${
                              low ? 'text-red-600' : 'text-[var(--color-leaf)]'
                            }`}
                          >
                            {v.quantity}
                          </span>
                          <button
                            onClick={() => setQuickAdd(v)}
                            aria-label={`Add stock to ${v.plantName} ${v.size}`}
                            className="flex items-center gap-1 rounded-lg border-2 border-[var(--color-leaf)] px-2.5 py-1.5 text-sm font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]"
                          >
                            <Plus size={16} /> Add
                          </button>
                          <button
                            onClick={() => setConfirmDelete(v)}
                            aria-label={`Delete ${v.plantName} ${v.size}`}
                            className="rounded-lg border-2 border-red-200 p-1.5 text-red-500 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {showAdd && (
        <Modal title="Add Stock" onClose={() => setShowAdd(false)}>
          <AddStockForm onDone={() => setShowAdd(false)} />
        </Modal>
      )}
      {showImport && (
        <Modal title="Bulk Upload (Excel)" onClose={() => setShowImport(false)}>
          <BulkUpload onDone={() => setShowImport(false)} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal title="Delete plant?" onClose={() => setConfirmDelete(null)}>
          <p className="mb-4 text-gray-700">
            Remove <b>{confirmDelete.plantName} — {confirmDelete.size}</b> ({confirmDelete.quantity}{' '}
            in stock) from inventory? This cannot be undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setConfirmDelete(null)}
              className="flex-1 rounded-2xl border-2 border-gray-300 py-3 font-bold text-gray-600"
            >
              Cancel
            </button>
            <PrimaryButton
              onClick={handleDelete}
              disabled={deleting}
              className="!bg-red-600 flex-1"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </PrimaryButton>
          </div>
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
