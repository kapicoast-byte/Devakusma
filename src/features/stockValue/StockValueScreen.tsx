import { Screen, Card } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { entryValue, totalStockValue, formatRupees } from '@/lib/logic';

/** Module 08 — Stock Value (plant-wise breakdown + grand total). */
export default function StockValueScreen() {
  const { plants } = useData();
  const total = totalStockValue(plants);

  return (
    <Screen title="Stock Value">
      <Card className="mb-5 text-center">
        <div className="text-gray-600">Total Nursery Stock Value</div>
        <div className="my-1 text-4xl font-extrabold text-[var(--color-leaf)]">
          {formatRupees(total)}
        </div>
      </Card>

      <div className="overflow-hidden rounded-2xl border-2 border-[var(--color-mint-border)] bg-white">
        <table className="w-full text-left">
          <thead className="bg-[var(--color-mint)] text-gray-700">
            <tr>
              <th className="px-3 py-2">Plant &amp; Size</th>
              <th className="px-2 py-2 text-right">Qty</th>
              <th className="px-2 py-2 text-right">Price</th>
              <th className="px-3 py-2 text-right">Value</th>
            </tr>
          </thead>
          <tbody>
            {plants.map((p) => (
              <tr key={p.id} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <div className="font-semibold">{p.plantName}</div>
                  <div className="text-sm text-gray-500">{p.size}</div>
                </td>
                <td className="px-2 py-2 text-right">{p.quantity}</td>
                <td className="px-2 py-2 text-right">{formatRupees(p.sellingPrice)}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatRupees(entryValue(p))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Screen>
  );
}
