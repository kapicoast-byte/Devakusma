import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { Screen, Card } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { searchPlants, formatRupees } from '@/lib/logic';

/** Module 02 (Plants Available) + Module 09 (Search). */
export default function PlantsScreen() {
  const { plants, loading } = useData();
  const [q, setQ] = useState('');

  const results = useMemo(() => searchPlants(plants, q), [plants, q]);

  return (
    <Screen title="Plants Available">
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
      ) : results.length === 0 ? (
        <p className="text-center text-gray-500">No plants found.</p>
      ) : (
        <ul className="space-y-3">
          {results.map((p) => {
            const low = p.quantity < p.minThreshold;
            return (
              <li key={p.id}>
                <Card className={low ? 'border-red-300' : ''}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{p.plantName}</div>
                      <div className="text-gray-500">{p.size}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-extrabold ${low ? 'text-red-600' : 'text-[var(--color-leaf)]'}`}>
                        {p.quantity}
                      </div>
                      <div className="text-gray-500">{formatRupees(p.sellingPrice)}</div>
                    </div>
                  </div>
                  {low && (
                    <div className="mt-2 text-sm font-semibold text-red-600">
                      ⚠️ Low stock (below {p.minThreshold})
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
