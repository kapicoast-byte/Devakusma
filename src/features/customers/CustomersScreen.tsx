import { useEffect, useState } from 'react';
import { Plus, Trash2, Phone, CalendarClock, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { Screen, Card, Modal, Field, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { formatRupees } from '@/lib/logic';
import {
  addCustomer,
  deleteCustomer,
  recordCustomerTxn,
  setCustomerDueDate,
  watchCustomerTxns,
} from '@/lib/repository';
import type { Customer, CustomerTxn } from '@/types';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const fmtDate = (ms: number) =>
  new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** Customers — outstanding credit (khata) with due dates and a payment ledger. */
export default function CustomersScreen() {
  const { customers } = useData();
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);

  const totalOutstanding = customers.reduce((s, c) => s + c.balance, 0);
  const overdue = customers.filter((c) => c.balance > 0 && c.dueDate && c.dueDate < startOfToday());

  // Keep the open detail in sync with live data.
  const liveSelected = selected ? customers.find((c) => c.id === selected.id) ?? null : null;

  return (
    <Screen
      title="Customers"
      subtitle="Credit & due dates"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-leaf)] px-4 py-2 font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]"
        >
          <Plus size={18} /> Add Customer
        </button>
      }
    >
      {/* Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-gray-500">Total Outstanding</div>
          <div className="text-xl font-extrabold text-red-700">{formatRupees(totalOutstanding)}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Overdue</div>
          <div className="text-xl font-extrabold text-gray-900">
            {overdue.length} <span className="text-sm font-normal text-gray-500">customer{overdue.length === 1 ? '' : 's'}</span>
          </div>
        </Card>
      </div>

      {customers.length === 0 ? (
        <Card className="text-center text-gray-500">No customers yet. Tap “Add Customer”.</Card>
      ) : (
        <ul className="space-y-3">
          {customers.map((c) => {
            const isOverdue = c.balance > 0 && c.dueDate && c.dueDate < startOfToday();
            return (
              <li key={c.id}>
                <button
                  onClick={() => setSelected(c)}
                  className="w-full text-left"
                >
                  <Card className={isOverdue ? 'border-red-200' : ''}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-gray-800">{c.name}</div>
                        <div className="flex flex-wrap items-center gap-x-3 text-sm text-gray-500">
                          {c.mobile && (
                            <span className="inline-flex items-center gap-1"><Phone size={13} /> {c.mobile}</span>
                          )}
                          {c.dueDate && c.balance > 0 && (
                            <span className={`inline-flex items-center gap-1 ${isOverdue ? 'font-semibold text-red-600' : ''}`}>
                              <CalendarClock size={13} /> Due {fmtDate(c.dueDate)}{isOverdue ? ' · overdue' : ''}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-extrabold ${c.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
                          {formatRupees(c.balance)}
                        </div>
                        <div className="text-xs text-gray-400">{c.balance > 0 ? 'owes' : 'settled'}</div>
                      </div>
                    </div>
                  </Card>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {showAdd && <AddCustomer onDone={() => setShowAdd(false)} />}
      {liveSelected && <CustomerDetail customer={liveSelected} onClose={() => setSelected(null)} />}
    </Screen>
  );
}

function AddCustomer({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    if (!name.trim()) return setError('Enter a name.');
    setSaving(true);
    try {
      await addCustomer({ name, mobile });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Customer" onClose={onDone}>
      <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
      <Field label="Mobile (optional)" type="tel" inputMode="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="98765 43210" />
      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
      <PrimaryButton onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</PrimaryButton>
    </Modal>
  );
}

function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const [txns, setTxns] = useState<CustomerTxn[]>([]);
  const [mode, setMode] = useState<'charge' | 'payment' | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [due, setDue] = useState(customer.dueDate ? new Date(customer.dueDate).toISOString().slice(0, 10) : '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => watchCustomerTxns(customer.id, setTxns), [customer.id]);

  const isOverdue = customer.balance > 0 && customer.dueDate && customer.dueDate < startOfToday();

  async function saveTxn() {
    setError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter a valid amount.');
    setBusy(true);
    try {
      await recordCustomerTxn({ customerId: customer.id, type: mode!, amount: amt, note: note.trim() || undefined });
      setMode(null);
      setAmount('');
      setNote('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function saveDue(value: string) {
    setDue(value);
    await setCustomerDueDate(customer.id, value ? new Date(value).getTime() : undefined);
  }

  return (
    <Modal title={customer.name} onClose={onClose}>
      {/* Balance */}
      <Card className="mb-4 text-center">
        <div className="text-sm text-gray-500">Outstanding credit</div>
        <div className={`text-3xl font-extrabold ${customer.balance > 0 ? 'text-red-700' : 'text-green-700'}`}>
          {formatRupees(customer.balance)}
        </div>
        {customer.mobile && <div className="mt-1 text-sm text-gray-500">{customer.mobile}</div>}
      </Card>

      {/* Due date */}
      <label className="mb-4 block">
        <span className="mb-1.5 block text-sm font-medium text-gray-600">
          Pay by {isOverdue ? <span className="font-semibold text-red-600">(overdue)</span> : ''}
        </span>
        <input
          type="date"
          value={due}
          onChange={(e) => saveDue(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-3.5 py-2.5 text-base shadow-sm outline-none focus:border-[var(--color-leaf)]"
        />
      </label>

      {/* Actions */}
      {mode === null ? (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <button
            onClick={() => setMode('charge')}
            className="flex items-center justify-center gap-2 rounded-xl border border-red-200 py-3 font-bold text-red-700 transition hover:bg-red-50"
          >
            <ArrowUpCircle size={18} /> Add Credit
          </button>
          <button
            onClick={() => setMode('payment')}
            className="flex items-center justify-center gap-2 rounded-xl border border-green-200 py-3 font-bold text-green-700 transition hover:bg-green-50"
          >
            <ArrowDownCircle size={18} /> Payment
          </button>
        </div>
      ) : (
        <Card className="mb-4">
          <div className="mb-2 font-bold text-gray-800">
            {mode === 'charge' ? 'Add credit (customer owes more)' : 'Record a payment'}
          </div>
          <Field label="Amount (₹)" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500" />
          <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === 'charge' ? 'e.g. 2 Areca on credit' : 'e.g. cash'} />
          {error && <p className="mb-3 font-semibold text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setMode(null); setError(''); }} className="flex-1 rounded-xl border border-gray-300 py-2.5 font-semibold text-gray-600">Cancel</button>
            <PrimaryButton onClick={saveTxn} disabled={busy} className="flex-1">{busy ? 'Saving…' : 'Save'}</PrimaryButton>
          </div>
        </Card>
      )}

      {/* Ledger */}
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wide text-gray-500">History</h3>
        <button onClick={() => deleteCustomer(customer.id)} className="inline-flex items-center gap-1 text-sm font-semibold text-red-500">
          <Trash2 size={14} /> Delete customer
        </button>
      </div>
      {txns.length === 0 ? (
        <p className="text-sm text-gray-500">No transactions yet.</p>
      ) : (
        <ul className="space-y-1">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between border-b border-gray-100 py-2 text-sm">
              <div>
                <span className="font-semibold text-gray-700">{t.type === 'charge' ? 'Credit' : 'Payment'}</span>
                <span className="text-gray-500"> · {fmtDate(t.date)}{t.note ? ` · ${t.note}` : ''}</span>
              </div>
              <span className={t.type === 'charge' ? 'font-bold text-red-700' : 'font-bold text-green-700'}>
                {t.type === 'charge' ? '+' : '−'}{formatRupees(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
