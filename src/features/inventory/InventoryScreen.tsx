import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Pencil,
  MoreVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { Screen, Card, Modal, Toast, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { searchPlants, formatRupees, groupByPlant, entryValue } from '@/lib/logic';
import { deletePlant } from '@/lib/repository';
import { exportInventory } from '@/lib/bulkImport';
import AddStockForm from './AddStockForm';
import EditStockForm from './EditStockForm';
import BulkUpload from './BulkUpload';
import type { Plant } from '@/types';

type SortKey = 'name' | 'qty' | 'value';

/** Inventory module — search/filter/sort, add/edit/delete stock, bulk import/export. */
export default function InventoryScreen() {
  const { plants, loading, lowStock } = useData();
  const [params, setParams] = useSearchParams();

  const [q, setQ] = useState('');
  const [lowOnly, setLowOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('name');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [headerMenu, setHeaderMenu] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [actionFor, setActionFor] = useState<Plant | null>(null);
  const [quickAdd, setQuickAdd] = useState<Plant | null>(null);
  const [editPlant, setEditPlant] = useState<Plant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Plant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(''), 2200);
  };

  // Deep-link to the Add Stock dialog (e.g. from the dashboard).
  useEffect(() => {
    if (params.get('add')) {
      setShowAdd(true);
      params.delete('add');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = useMemo(() => {
    let list = searchPlants(plants, q);
    if (lowOnly) list = list.filter((p) => p.quantity < p.minThreshold);
    const g = groupByPlant(list);
    if (sortBy === 'qty') g.sort((a, b) => b.totalQuantity - a.totalQuantity);
    else if (sortBy === 'value') g.sort((a, b) => b.totalValue - a.totalValue);
    return g;
  }, [plants, q, lowOnly, sortBy]);

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletePlant(confirmDelete.id);
      setConfirmDelete(null);
      showToast('Deleted');
    } finally {
      setDeleting(false);
    }
  }

  const toggleGroup = (name: string) =>
    setCollapsed((s) => {
      const next = new Set(s);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });

  const sortLabels: Record<SortKey, string> = { name: 'Name', qty: 'Qty', value: 'Value' };

  return (
    <Screen
      title="Inventory"
      subtitle={`${plants.length} item${plants.length === 1 ? '' : 's'}`}
      actions={
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setHeaderMenu((v) => !v)}
              aria-label="Import or export"
              className="rounded-xl border-2 border-[var(--color-leaf)] p-2 text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]"
            >
              <MoreVertical size={20} />
            </button>
            {headerMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setHeaderMenu(false)} />
                <div className="absolute right-0 z-50 mt-1 w-48 overflow-hidden rounded-xl border-2 border-[var(--color-mint-border)] bg-white shadow-lg">
                  <button
                    onClick={() => {
                      setShowImport(true);
                      setHeaderMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-gray-700 hover:bg-[var(--color-mint)]"
                  >
                    <Upload size={18} /> Import Excel
                  </button>
                  <button
                    onClick={() => {
                      if (plants.length === 0) return showToast('Nothing to export');
                      exportInventory(plants);
                      setHeaderMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left font-semibold text-gray-700 hover:bg-[var(--color-mint)]"
                  >
                    <Download size={18} /> Export Excel
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 rounded-xl bg-[var(--color-leaf)] px-4 py-2 font-bold text-white shadow-md transition active:scale-[0.98]"
          >
            <Plus size={18} /> Add Stock
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="mb-3 flex items-center gap-2 rounded-xl border-2 border-[var(--color-mint-border)] bg-white px-3">
        <Search className="text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or size…"
          className="w-full py-3 text-lg outline-none"
        />
      </div>

      {/* Filter + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={`rounded-full border-2 px-3 py-1.5 font-semibold transition ${
            lowOnly
              ? 'border-red-400 bg-red-50 text-red-700'
              : 'border-[var(--color-mint-border)] bg-white text-gray-600'
          }`}
        >
          ⚠️ Low stock{lowStock.length ? ` (${lowStock.length})` : ''}
        </button>
        <span className="ml-auto text-gray-500">Sort:</span>
        {(['name', 'qty', 'value'] as SortKey[]).map((s) => (
          <button
            key={s}
            onClick={() => setSortBy(s)}
            className={`rounded-full border-2 px-3 py-1.5 font-semibold transition ${
              sortBy === s
                ? 'border-[var(--color-leaf)] bg-[var(--color-leaf)] text-white'
                : 'border-[var(--color-mint-border)] bg-white text-gray-600'
            }`}
          >
            {sortLabels[s]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-gray-500">Loading…</p>
      ) : groups.length === 0 ? (
        <p className="text-center text-gray-500">
          {plants.length === 0
            ? 'No plants yet. Tap “Add Stock” to begin.'
            : lowOnly
              ? 'No low-stock plants. 🎉'
              : 'No plants found.'}
        </p>
      ) : (
        <ul className="space-y-4">
          {groups.map((g) => {
            const isCollapsed = collapsed.has(g.plantName);
            return (
              <li key={g.plantName}>
                <Card className="!p-0 overflow-hidden">
                  {/* Plant header (click to collapse) */}
                  <button
                    onClick={() => toggleGroup(g.plantName)}
                    className="flex w-full items-center justify-between gap-2 bg-[var(--color-mint)] px-4 py-3 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                      <span className="text-lg font-bold text-gray-800">{g.plantName}</span>
                    </div>
                    <div className="text-right text-sm font-semibold text-gray-600">
                      <div>{g.totalQuantity} pcs · {g.variants.length} size{g.variants.length === 1 ? '' : 's'}</div>
                      <div className="text-[var(--color-leaf)]">{formatRupees(g.totalValue)}</div>
                    </div>
                  </button>

                  {/* Size variants */}
                  {!isCollapsed && (
                    <ul className="divide-y divide-gray-100">
                      {g.variants.map((v) => {
                        const low = v.quantity < v.minThreshold;
                        return (
                          <li key={v.id}>
                            <button
                              onClick={() => setActionFor(v)}
                              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-gray-50"
                            >
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
                                <div className="text-right">
                                  <div
                                    className={`text-lg font-extrabold ${
                                      low ? 'text-red-600' : 'text-[var(--color-leaf)]'
                                    }`}
                                  >
                                    {v.quantity}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    {formatRupees(entryValue(v))}
                                  </div>
                                </div>
                                <MoreVertical size={18} className="text-gray-400" />
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      {/* Per-row action sheet */}
      {actionFor && (
        <Modal title={`${actionFor.plantName} — ${actionFor.size}`} onClose={() => setActionFor(null)}>
          <div className="space-y-3">
            <SheetButton
              icon={<Plus size={20} />}
              label="Add stock"
              onClick={() => {
                setQuickAdd(actionFor);
                setActionFor(null);
              }}
            />
            <SheetButton
              icon={<Pencil size={20} />}
              label="Edit (count, price, alert)"
              onClick={() => {
                setEditPlant(actionFor);
                setActionFor(null);
              }}
            />
            <SheetButton
              icon={<Trash2 size={20} />}
              label="Delete"
              danger
              onClick={() => {
                setConfirmDelete(actionFor);
                setActionFor(null);
              }}
            />
          </div>
        </Modal>
      )}

      {showAdd && (
        <Modal title="Add Stock" onClose={() => setShowAdd(false)}>
          <AddStockForm
            onDone={() => {
              setShowAdd(false);
              showToast('Stock added');
            }}
          />
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
            onDone={() => {
              setQuickAdd(null);
              showToast('Stock added');
            }}
          />
        </Modal>
      )}
      {editPlant && (
        <Modal title="Edit Item" onClose={() => setEditPlant(null)}>
          <EditStockForm
            plant={editPlant}
            onDone={(m) => {
              setEditPlant(null);
              if (m) showToast(m);
            }}
          />
        </Modal>
      )}
      {showImport && (
        <Modal title="Bulk Upload (Excel)" onClose={() => setShowImport(false)}>
          <BulkUpload
            onDone={() => {
              setShowImport(false);
              showToast('Inventory imported');
            }}
          />
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
            <PrimaryButton onClick={handleDelete} disabled={deleting} className="!bg-red-600 flex-1">
              {deleting ? 'Deleting…' : 'Delete'}
            </PrimaryButton>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast} />}
    </Screen>
  );
}

function SheetButton({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border-2 bg-white px-4 py-4 text-lg font-bold transition active:scale-[0.99] ${
        danger
          ? 'border-red-200 text-red-600 hover:bg-red-50'
          : 'border-[var(--color-mint-border)] text-gray-800 hover:bg-[var(--color-mint)]'
      }`}
    >
      {icon} {label}
    </button>
  );
}
