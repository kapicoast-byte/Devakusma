import { useMemo, useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Screen, Card, Modal, Field, Select, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { formatRupees } from '@/lib/logic';
import { billsInPeriod, revenue, periodStart, type Period } from '@/lib/analytics';
import { addExpense, deleteExpense } from '@/lib/repository';

const CATEGORIES = [
  'Plants Purchase',
  'Labor',
  'Transport',
  'Supplies',
  'Rent',
  'Utilities',
  'Other',
];

const PERIODS: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
  { value: 'year', label: 'Year' },
];

/** Accounts — income (from bills), expenses, and net profit. */
export default function AccountsScreen() {
  const { bills, expenses } = useData();
  const [period, setPeriod] = useState<Period>('month');
  const [showAdd, setShowAdd] = useState(false);

  const income = useMemo(() => revenue(billsInPeriod(bills, period)), [bills, period]);
  const periodExpenses = useMemo(() => {
    const s = periodStart(period);
    return expenses.filter((e) => e.date >= s);
  }, [expenses, period]);

  const expenseTotal = periodExpenses.reduce((s, e) => s + e.amount, 0);
  const profit = income - expenseTotal;

  return (
    <Screen
      title="Accounts"
      subtitle="Income, expenses & profit"
      actions={
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 rounded-xl bg-[var(--color-leaf)] px-4 py-2 font-bold text-white shadow-[var(--shadow-soft)] transition active:scale-[0.98]"
        >
          <Plus size={18} /> Add Expense
        </button>
      }
    >
      {/* Period filter */}
      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`rounded-full border px-4 py-1.5 font-semibold transition ${
              period === p.value
                ? 'border-[var(--color-leaf)] bg-[var(--color-leaf)] text-white'
                : 'border-[var(--border)] bg-white text-gray-600'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-green-50 p-2 text-green-600"><TrendingUp size={22} /></span>
          <div>
            <div className="text-sm text-gray-500">Income</div>
            <div className="text-xl font-extrabold text-green-700">{formatRupees(income)}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-red-50 p-2 text-red-600"><TrendingDown size={22} /></span>
          <div>
            <div className="text-sm text-gray-500">Expenses</div>
            <div className="text-xl font-extrabold text-red-700">{formatRupees(expenseTotal)}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-[var(--color-mint)] p-2 text-[var(--color-leaf)]"><Wallet size={22} /></span>
          <div>
            <div className="text-sm text-gray-500">Net Profit</div>
            <div className={`text-xl font-extrabold ${profit >= 0 ? 'text-[var(--color-leaf)]' : 'text-red-700'}`}>
              {formatRupees(profit)}
            </div>
          </div>
        </Card>
      </div>

      {/* Expense list */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Expenses</h2>
      {periodExpenses.length === 0 ? (
        <Card className="text-center text-gray-500">No expenses in this period.</Card>
      ) : (
        <ul className="space-y-2">
          {periodExpenses.map((e) => (
            <li key={e.id}>
              <Card className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-800">{e.category}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(e.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {e.note ? ` · ${e.note}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-red-700">−{formatRupees(e.amount)}</span>
                  <button onClick={() => deleteExpense(e.id)} aria-label="Delete expense" className="text-red-400 hover:text-red-600">
                    <Trash2 size={18} />
                  </button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {showAdd && <AddExpense onDone={() => setShowAdd(false)} />}
    </Screen>
  );
}



function AddExpense({ onDone }: { onDone: () => void }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) return setError('Enter a valid amount.');
    setSaving(true);
    try {
      await addExpense({ category, amount: amt, note: note.trim() || undefined, date: new Date(date).getTime() });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Modal title="Add Expense" onClose={onDone}>
      <Select
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        options={CATEGORIES.map((c) => ({ value: c, label: c }))}
      />
      <Field label="Amount (₹)" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 5000" />
      <Field label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <Field label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. 200 Areca saplings" />
      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Expense'}
      </PrimaryButton>
    </Modal>
  );
}
