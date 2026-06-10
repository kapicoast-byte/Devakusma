import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Screen, Field, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { addStock } from '@/lib/repository';
import { findEntry } from '@/lib/logic';

/** Module 03 — Add new stock (merges into existing plant+size, or creates new). */
export default function AddStockScreen() {
  const navigate = useNavigate();
  const { plants } = useData();
  const [plantName, setPlantName] = useState('');
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const plantNames = useMemo(
    () => [...new Set(plants.map((p) => p.plantName))].sort(),
    [plants],
  );
  const sizes = useMemo(() => [...new Set(plants.map((p) => p.size))].sort(), [plants]);

  // Show the current price when the worker picks an existing plant+size.
  const existing = findEntry(plants, plantName, size);

  async function handleSave() {
    setError('');
    const qty = Number(quantity);
    const pr = Number(price);
    if (!plantName.trim() || !size.trim()) return setError('Enter a plant name and size.');
    if (!Number.isFinite(qty) || qty <= 0) return setError('Enter a valid quantity.');
    if (!Number.isFinite(pr) || pr <= 0) return setError('Enter a valid selling price.');
    setSaving(true);
    try {
      await addStock({ plantName, size, quantity: qty, sellingPrice: pr });
      navigate('/plants');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <Screen title="Add Plants">
      <datalist id="plant-names">
        {plantNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <datalist id="sizes">
        {sizes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <Field
        label="Plant Name"
        list="plant-names"
        value={plantName}
        onChange={(e) => setPlantName(e.target.value)}
        placeholder="e.g. Areca Palm"
      />
      <Field
        label="Plant Size"
        list="sizes"
        value={size}
        onChange={(e) => setSize(e.target.value)}
        placeholder="e.g. 2 ft"
      />
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

      {existing && (
        <p className="mb-4 rounded-lg bg-[var(--color-mint)] p-3 text-gray-700">
          Already in stock: <b>{existing.quantity}</b> at ₹{existing.sellingPrice}. New quantity
          will be added on top.
        </p>
      )}
      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}

      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </PrimaryButton>
    </Screen>
  );
}
