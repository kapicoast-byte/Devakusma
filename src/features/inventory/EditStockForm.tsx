import { useState } from 'react';
import { Field, PrimaryButton } from '@/components/ui';
import { updatePlant } from '@/lib/repository';
import { formatRupees } from '@/lib/logic';
import type { Plant } from '@/types';

/** Edit an existing inventory entry: exact quantity, price, and low-stock threshold. */
export default function EditStockForm({
  plant,
  onDone,
}: {
  plant: Plant;
  onDone: (message?: string) => void;
}) {
  const [quantity, setQuantity] = useState(String(plant.quantity));
  const [price, setPrice] = useState(String(plant.sellingPrice));
  const [threshold, setThreshold] = useState(String(plant.minThreshold));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    setError('');
    const q = Number(quantity);
    const pr = Number(price);
    const th = Number(threshold);
    if (!Number.isFinite(q) || q < 0) return setError('Enter a valid quantity.');
    if (!Number.isFinite(pr) || pr <= 0) return setError('Enter a valid selling price.');
    if (!Number.isFinite(th) || th < 0) return setError('Enter a valid threshold.');
    setSaving(true);
    try {
      await updatePlant(plant.id, { quantity: q, sellingPrice: pr, minThreshold: th });
      onDone('Changes saved');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-4 rounded-xl border-2 border-[var(--color-mint-border)] bg-white p-3">
        <div className="font-bold text-gray-800">
          {plant.plantName} — {plant.size}
        </div>
        <div className="text-sm text-gray-500">
          Currently {plant.quantity} at {formatRupees(plant.sellingPrice)}
        </div>
      </div>

      <Field
        label="Quantity (exact count)"
        type="number"
        inputMode="numeric"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
      />
      <Field
        label="Selling Price (₹)"
        type="number"
        inputMode="numeric"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />
      <Field
        label="Low-stock alert when below"
        type="number"
        inputMode="numeric"
        value={threshold}
        onChange={(e) => setThreshold(e.target.value)}
      />

      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Changes'}
      </PrimaryButton>
    </div>
  );
}
