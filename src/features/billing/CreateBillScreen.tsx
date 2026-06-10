import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Download, Share2, Printer } from 'lucide-react';
import { Screen, Field, PrimaryButton, Card } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { createBill } from '@/lib/repository';
import { findEntry, formatRupees, lineTotal, billGrandTotal } from '@/lib/logic';
import { downloadInvoice, printInvoice } from '@/lib/invoice';
import { shareOnWhatsApp } from '@/lib/share';
import type { Bill, BillItem } from '@/types';

export default function CreateBillScreen() {
  const navigate = useNavigate();
  const { plants } = useData();

  const [customerName, setCustomerName] = useState('');
  const [mobile, setMobile] = useState('');
  const [items, setItems] = useState<BillItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedBill, setSavedBill] = useState<Bill | null>(null);

  // draft item being added
  const [plantName, setPlantName] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState('');

  const plantNames = useMemo(() => [...new Set(plants.map((p) => p.plantName))].sort(), [plants]);
  const sizesForPlant = useMemo(
    () => plants.filter((p) => p.plantName === plantName).map((p) => p.size),
    [plants, plantName],
  );
  const entry = findEntry(plants, plantName, size); // rate comes from here — never typed
  const grandTotal = billGrandTotal(items);

  function addItem() {
    setError('');
    const n = Number(qty);
    if (!entry) return setError('Pick a plant and size that is in stock.');
    if (!Number.isFinite(n) || n <= 0) return setError('Enter a valid quantity.');
    if (n > entry.quantity) return setError(`Only ${entry.quantity} available.`);
    setItems((prev) => [
      ...prev,
      { plantName: entry.plantName, size: entry.size, qty: n, rate: entry.sellingPrice, lineTotal: lineTotal(n, entry.sellingPrice) },
    ]);
    setPlantName('');
    setSize('');
    setQty('');
  }

  async function handleSave() {
    setError('');
    if (!customerName.trim()) return setError('Enter a customer name.');
    if (items.length === 0) return setError('Add at least one plant.');
    setSaving(true);
    try {
      const bill = await createBill({ customerName, mobile, items });
      setSavedBill(bill);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Success view: invoice actions (Module 06) ──
  if (savedBill) {
    return (
      <Screen title="Bill Created">
        <Card className="mb-5 text-center">
          <div className="text-lg text-gray-600">Invoice {savedBill.invoiceNo}</div>
          <div className="my-2 text-3xl font-extrabold text-[var(--color-leaf)]">
            {formatRupees(savedBill.grandTotal)}
          </div>
          <div className="text-gray-600">{savedBill.customerName}</div>
        </Card>
        <div className="space-y-3">
          <PrimaryButton onClick={() => shareOnWhatsApp(savedBill)}>
            <span className="inline-flex items-center justify-center gap-2"><Share2 /> Share via WhatsApp</span>
          </PrimaryButton>
          <button onClick={() => downloadInvoice(savedBill)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[var(--color-leaf)] py-4 text-lg font-bold text-[var(--color-leaf)]">
            <Download /> Download PDF
          </button>
          <button onClick={() => printInvoice(savedBill)} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 py-4 text-lg font-bold text-gray-700">
            <Printer /> Print
          </button>
          <button onClick={() => navigate('/')} className="w-full py-3 text-gray-500">Done</button>
        </div>
      </Screen>
    );
  }

  // ── Bill builder ──
  return (
    <Screen title="Create Bill">
      <datalist id="bill-names">{plantNames.map((n) => <option key={n} value={n} />)}</datalist>
      <datalist id="bill-sizes">{sizesForPlant.map((s) => <option key={s} value={s} />)}</datalist>

      <h2 className="mb-2 font-bold text-gray-700">Customer</h2>
      <Field label="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Required" />
      <Field label="Mobile Number (optional)" type="tel" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="For WhatsApp share" />

      <h2 className="mb-2 mt-4 font-bold text-gray-700">Add Plants</h2>
      <Field label="Plant Name" list="bill-names" value={plantName} onChange={(e) => setPlantName(e.target.value)} placeholder="Select plant" />
      <Field label="Size" list="bill-sizes" value={size} onChange={(e) => setSize(e.target.value)} placeholder="Select size" />
      <div className="mb-3 flex items-end gap-3">
        <div className="flex-1">
          <Field label="Quantity" type="number" inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qty" />
        </div>
        <div className="mb-4 min-w-24 text-right">
          <div className="text-sm text-gray-500">Rate (auto)</div>
          <div className="text-lg font-bold text-[var(--color-leaf)]">
            {entry ? formatRupees(entry.sellingPrice) : '—'}
          </div>
        </div>
      </div>
      <button onClick={addItem} className="mb-5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-leaf)] py-3 font-bold text-[var(--color-leaf)]">
        <Plus /> Add to bill
      </button>

      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((it, i) => (
            <li key={i}>
              <Card className="flex items-center justify-between py-3">
                <div>
                  <div className="font-bold text-gray-800">{it.plantName} — {it.size}</div>
                  <div className="text-gray-500">{it.qty} × {formatRupees(it.rate)}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatRupees(it.lineTotal)}</span>
                  <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} aria-label="Remove" className="text-red-500">
                    <Trash2 size={20} />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="mb-4 flex items-center justify-between rounded-xl bg-[var(--color-mint)] px-4 py-3 text-lg">
        <span className="font-semibold">Grand Total</span>
        <span className="font-extrabold text-[var(--color-leaf)]">{formatRupees(grandTotal)}</span>
      </div>

      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Create Bill'}
      </PrimaryButton>
    </Screen>
  );
}
