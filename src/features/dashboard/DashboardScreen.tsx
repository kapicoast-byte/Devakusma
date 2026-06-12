import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import {
  FileDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  Wallet,
} from 'lucide-react';
import { Screen, Card, PrimaryButton } from '@/components/ui';
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

/** Landing page — business overview and quick actions. */
export default function DashboardScreen() {
  const navigate = useNavigate();
  const { plants, bills, lowStock } = useData();
  const summary = salesSummary(bills);
  const ranked = rankPlantsBySales(bills);
  const trend = monthlyTrend(bills);
  const inv = inventorySummary(plants);
  const fast = ranked.slice(0, 5);
  const slow = [...ranked].reverse().slice(0, 5);

  return (
    <Screen
      title="Dashboard"
      subtitle="Your nursery at a glance"
      actions={
        <button
          onClick={() => downloadMonthlyReport(bills, plants)}
          className="hidden items-center gap-2 rounded-xl border-2 border-[var(--color-leaf)] px-4 py-2 font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)] sm:flex"
        >
          <FileDown size={18} /> Monthly Report
        </button>
      }
    >
      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <button
          onClick={() => navigate('/inventory')}
          className="mb-5 flex w-full items-start gap-3 rounded-2xl border-2 border-red-300 bg-red-50 p-4 text-left text-red-800 transition hover:bg-red-100"
        >
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <div className="font-bold">Low Stock Alert ({lowStock.length})</div>
            <div className="mt-0.5 text-sm">
              {lowStock.slice(0, 3).map((p) => `${p.plantName} ${p.size} (${p.quantity})`).join(', ')}
              {lowStock.length > 3 ? ` +${lowStock.length - 3} more` : ''}
            </div>
          </div>
        </button>
      )}

      {/* Sales summary */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Sales</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {(['today', 'week', 'month', 'year'] as const).map((k) => (
          <Card key={k}>
            <div className="text-sm capitalize text-gray-500">{k}</div>
            <div className="mt-1 text-xl font-extrabold text-[var(--color-leaf)]">
              {formatRupees(summary[k])}
            </div>
          </Card>
        ))}
      </div>

      {/* Inventory summary */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-[var(--color-mint)] p-2 text-[var(--color-leaf)]">
            <Package size={22} />
          </span>
          <div>
            <div className="text-sm text-gray-500">Total Plants</div>
            <div className="text-xl font-bold">{inv.totalPlants}</div>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="rounded-xl bg-[var(--color-mint)] p-2 text-[var(--color-leaf)]">
            <Wallet size={22} />
          </span>
          <div>
            <div className="text-sm text-gray-500">Inventory Value</div>
            <div className="text-xl font-bold">{formatRupees(inv.totalValue)}</div>
          </div>
        </Card>
      </div>

      {/* Monthly sales trend */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
        Monthly Sales Trend (units)
      </h2>
      <Card className="mb-6">
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

      {/* Fast / slow movers */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <RankList title="Fast Moving" icon={<TrendingUp size={18} />} rows={fast} empty="No sales yet." />
        <RankList title="Slow Moving" icon={<TrendingDown size={18} />} rows={slow} empty="No sales yet." />
      </div>

      {/* Seasonal insights */}
      <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">Seasonal Insights</h2>
      <Card className="mb-6 text-gray-600">
        {hasSeasonalData(bills)
          ? 'Insights are being generated from your sales history.'
          : 'Seasonal insights appear after at least 3 months of sales data.'}
      </Card>

      <PrimaryButton onClick={() => downloadMonthlyReport(bills, plants)}>
        <span className="inline-flex items-center justify-center gap-2">
          <FileDown /> Download Monthly Report (PDF)
        </span>
      </PrimaryButton>
    </Screen>
  );
}

function RankList({
  title,
  icon,
  rows,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  rows: { plantName: string; units: number }[];
  empty: string;
}) {
  return (
    <Card>
      <div className="mb-2 flex items-center gap-2 font-bold text-gray-700">
        {icon} {title}
      </div>
      {rows.length === 0 ? (
        <p className="text-gray-500">{empty}</p>
      ) : (
        <ol className="space-y-1">
          {rows.map((r, i) => (
            <li key={r.plantName} className="flex justify-between">
              <span className="text-gray-700">{i + 1}. {r.plantName}</span>
              <span className="font-semibold">{r.units}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
