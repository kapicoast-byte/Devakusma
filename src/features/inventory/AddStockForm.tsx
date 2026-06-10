import { useMemo, useState } from 'react';
import { Field, Select, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { addStock } from '@/lib/repository';
import { findEntry } from '@/lib/logic';

const NEW = '__new__';

interface Props {
  onDone: () => void;
  /** When set, the plant + size are fixed (quick add for an existing entry). */
  lockTo?: { plantName: string; size: string; sellingPrice: number; quantity: number };
}

/** Add-stock form: pick from inventory or add a new plant/size, or quick-add to a locked entry. */
export default function AddStockForm({ onDone, lockTo }: Props) {
  const { plants } = useData();
  const locked = Boolean(lockTo);

  const [plantSel, setPlantSel] = useState('');
  const [plantNew, setPlantNew] = useState('');
  const [sizeSel, setSizeSel] = useState('');
  const [sizeNew, setSizeNew] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState(lockTo ? String(lockTo.sellingPrice) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const plantNames = useMemo(() => [...new Set(plants.map((p) => p.plantName))].sort(), [plants]);

  const isNewPlant = plantSel === NEW;
  const plantName = locked ? lockTo!.plantName : (isNewPlant ? plantNew : plantSel).trim();

  const sizesForPlant = useMemo(
    () =>
      isNewPlant
        ? []
        : [...new Set(plants.filter((p) => p.plantName === plantSel).map((p) => p.size))].sort(),
    [plants, plantSel, isNewPlant],
  );
  const sizeIsFreeText = isNewPlant || sizesForPlant.length === 0;
  const isNewSize = sizeIsFreeText || sizeSel === NEW;
  const size = locked ? lockTo!.size : (isNewSize ? sizeNew : sizeSel).trim();

  const existing = findEntry(plants, plantName, size);

  async function handleSave() {
    setError('');
    const qty = Number(quantity);
    const pr = Number(price);
    if (!plantName || !size) return setError('Choose a plant and size.');
    if (!Number.isFinite(qty) || qty <= 0) return setError('Enter a valid quantity.');
    if (!Number.isFinite(pr) || pr <= 0) return setError('Enter a valid selling price.');
    setSaving(true);
    try {
      await addStock({ plantName, size, quantity: qty, sellingPrice: pr });
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div>
      {locked ? (
        <div className="mb-4 rounded-xl border-2 border-[var(--color-mint-border)] bg-white p-3">
          <div className="font-bold text-gray-800">
            {lockTo!.plantName} — {lockTo!.size}
          </div>
          <div className="text-sm text-gray-500">
            In stock: {lockTo!.quantity} · ₹{lockTo!.sellingPrice}
          </div>
        </div>
      ) : (
        <>
          <Select
            label="Plant Name"
            placeholder="Select a plant"
            value={plantSel}
            onChange={(e) => {
              setPlantSel(e.target.value);
              setSizeSel('');
              setSizeNew('');
            }}
            options={[
              ...plantNames.map((n) => ({ value: n, label: n })),
              { value: NEW, label: '➕ New plant…' },
            ]}
          />
          {isNewPlant && (
            <Field
              label="New plant name"
              value={plantNew}
              onChange={(e) => setPlantNew(e.target.value)}
              placeholder="e.g. Areca Palm"
            />
          )}

          {sizeIsFreeText ? (
            <Field
              label="Plant Size"
              value={sizeNew}
              onChange={(e) => setSizeNew(e.target.value)}
              placeholder="e.g. 2 ft"
            />
          ) : (
            <>
              <Select
                label="Plant Size"
                placeholder="Select a size"
                value={sizeSel}
                onChange={(e) => setSizeSel(e.target.value)}
                options={[
                  ...sizesForPlant.map((s) => ({ value: s, label: s })),
                  { value: NEW, label: '➕ New size…' },
                ]}
              />
              {sizeSel === NEW && (
                <Field
                  label="New size"
                  value={sizeNew}
                  onChange={(e) => setSizeNew(e.target.value)}
                  placeholder="e.g. 3 ft"
                />
              )}
            </>
          )}
        </>
      )}

      <Field
        label="Quantity to add"
        type="number"
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        placeholder="e.g. 50"
      />
      <Field
        label="Selling Price (₹)"
        type="number"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder={existing ? `Current: ₹${existing.sellingPrice}` : 'e.g. 250'}
      />

      {!locked && existing && (
        <p className="mb-4 rounded-lg bg-white p-3 text-gray-700">
          Already in stock: <b>{existing.quantity}</b> at ₹{existing.sellingPrice}. New quantity
          will be added on top.
        </p>
      )}
      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}

      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </div>
  );
}
