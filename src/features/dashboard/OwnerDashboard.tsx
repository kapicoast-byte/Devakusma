import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { FileDown, Lock } from 'lucide-react';
import { Screen, Card, Field, PrimaryButton } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { formatRupees } from '@/lib/logic';
import {
  salesSummary,
  rankPlantsBySales,
  monthlyTrend,
  inventorySummary,
  hasSeasonalData,
} from '@/lib/analytics';
import { downloadMonthlyReport } from '@/lib/report';

const OWNER_PIN = import.meta.env.VITE_OWNER_PIN || '1234';

export default function OwnerDashboard() {
  const { role, unlockOwner } = useData();
  if (role !== 'owner') return <PinGate onUnlock={unlockOwner} />;
  return <Dashboard />;
}

function PinGate({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  return (
    <Screen title="Owner Dashboard">
      <Card className="text-center">
        <Lock className="mx-auto mb-2 text-[var(--color-leaf)]" size={36} />
        <p className="mb-4 text-gray-600">This area is for the owner only.</p>
        <Field
          label="Enter PIN"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="••••"
        />
        {error && <p className="mb-3 font-semibold text-red-600">{error}</p>}
        <PrimaryButton onClick={() => (pin === OWNER_PIN ? onUnlock() : setError('Wrong PIN. Try again.'))}>
          Unlock
        </PrimaryButton>
      </Card>
    </Screen>
  );
}

function Dashboard() {
  const { plants, bills } = useData();
  const summary = salesSummary(bills);
  const ranked = rankPlantsBySales(bills);
  const trend = monthlyTrend(bills);
  const inv = inventorySummary(plants);
  const fast = ranked.slice(0, 5);
  const slow = [...ranked].reverse().slice(0, 5);

  return (
    <Screen title="Owner Dashboard">
      {/* 6.1 Sales Summary */}
      <h2 className="mb-2 font-bold text-gray-700">Sales Summary</h2>
      <div className="mb-5 grid grid-cols-2 gap-3">
        {(['today', 'week', 'month', 'year'] as const).map((k) => (
          <Card key={k}>
            <div className="text-sm capitalize text-gray-500">{k}</div>
            <div className="text-xl font-extrabold text-[var(--color-leaf)]">{formatRupees(summary[k])}</div>
          </Card>
        ))}
      </div>

      {/* 6.6 Inventory Summary */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <Card>
          <div className="text-sm text-gray-500">Total Plants</div>
          <div className="text-xl font-bold">{inv.totalPlants}</div>
        </Card>
        <Card>
          <div className="text-sm text-gray-500">Inventory Value</div>
          <div className="text-xl font-bold">{formatRupees(inv.totalValue)}</div>
        </Card>
      </div>

      {/* 6.3 Monthly Sales Trend */}
      <h2 className="mb-2 font-bold text-gray-700">Monthly Sales Trend (units)</h2>
      <Card className="mb-5">
        <div style={{ width: '100%', height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={trend}>
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} width={28} />
              <Tooltip />
              <Bar dataKey="total" fill="#2e7d32" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 6.2 / 6.4 Fast moving */}
      <RankList title="Top / Fast Moving Plants" rows={fast} empty="No sales yet." />
      {/* 6.5 Slow moving */}
      <RankList title="Slow Moving Plants" rows={slow} empty="No sales yet." />

      {/* 6.7 Seasonal Insights — gated until 3 months of data */}
      <h2 className="mb-2 mt-5 font-bold text-gray-700">Seasonal Insights</h2>
      <Card className="mb-5 text-gray-600">
        {hasSeasonalData(bills)
          ? 'Insights are being generated from your sales history.'
          : 'Seasonal insights appear after at least 3 months of sales data.'}
      </Card>

      {/* 6.8 Monthly Business Report */}
      <PrimaryButton onClick={() => downloadMonthlyReport(bills, plants)}>
        <span className="inline-flex items-center justify-center gap-2"><FileDown /> Download Monthly Report (PDF)</span>
      </PrimaryButton>
    </Screen>
  );
}

function RankList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: { plantName: string; units: number }[];
  empty: string;
}) {
  return (
    <>
      <h2 className="mb-2 mt-5 font-bold text-gray-700">{title}</h2>
      <Card>
        {rows.length === 0 ? (
          <p className="text-gray-500">{empty}</p>
        ) : (
          <ol className="space-y-1">
            {rows.map((r, i) => (
              <li key={r.plantName} className="flex justify-between">
                <span>{i + 1}. {r.plantName}</span>
                <span className="font-semibold">{r.units} units</span>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </>
  );
}
