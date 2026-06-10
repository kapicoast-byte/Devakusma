import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Screen, Field, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { changeSize } from '@/lib/repository';
import { findEntry, validateSizeChange, norm } from '@/lib/logic';

/** Module 04 — Change plant size (track growth). */
export default function ChangeSizeScreen() {
  const navigate = useNavigate();
  const { plants } = useData();
  const [plantName, setPlantName] = useState('');
  const [fromSize, setFromSize] = useState('');
  const [toSize, setToSize] = useState('');
  const [qty, setQty] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const plantNames = useMemo(() => [...new Set(plants.map((p) => p.plantName))].sort(), [plants]);
  // Sizes that actually have stock for the chosen plant.
  const fromSizes = useMemo(
    () => plants.filter((p) => norm(p.plantName) === norm(plantName) && p.quantity > 0).map((p) => p.size),
    [plants, plantName],
  );
  const allSizes = useMemo(() => [...new Set(plants.map((p) => p.size))].sort(), [plants]);

  const from = findEntry(plants, plantName, fromSize);

  async function handleConfirm() {
    setError('');
    const n = Number(qty);
    const err = validateSizeChange(from, fromSize, toSize, n);
    if (err) return setError(err);
    setSaving(true);
    try {
      await changeSize({ plantName, fromSize, toSize, qty: n });
      navigate('/plants');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen title="Change Plant Size">
      <datalist id="cs-names">
        {plantNames.map((n) => <option key={n} value={n} />)}
      </datalist>
      <datalist id="cs-from">
        {fromSizes.map((s) => <option key={s} value={s} />)}
      </datalist>
      <datalist id="cs-to">
        {allSizes.map((s) => <option key={s} value={s} />)}
      </datalist>

      <Field
        label="Plant Name"
        list="cs-names"
        value={plantName}
        onChange={(e) => setPlantName(e.target.value)}
        placeholder="e.g. Areca Palm"
      />
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Field
            label="From Size"
            list="cs-from"
            value={fromSize}
            onChange={(e) => setFromSize(e.target.value)}
            placeholder="1 ft"
          />
        </div>
        <ArrowRight className="mb-7 text-[var(--color-leaf)]" />
        <div className="flex-1">
          <Field
            label="To Size"
            list="cs-to"
            value={toSize}
            onChange={(e) => setToSize(e.target.value)}
            placeholder="2 ft"
          />
        </div>
      </div>
      <Field
        label="Quantity to move"
        type="number"
        inputMode="numeric"
        value={qty}
        onChange={(e) => setQty(e.target.value)}
        placeholder="e.g. 100"
      />

      {from && (
        <p className="mb-4 rounded-lg bg-[var(--color-mint)] p-3 text-gray-700">
          Available at {fromSize}: <b>{from.quantity}</b>
        </p>
      )}
      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}

      <PrimaryButton onClick={handleConfirm} disabled={saving}>
        {saving ? 'Moving…' : 'Confirm'}
      </PrimaryButton>
    </Screen>
  );
}
