import type { Bill, Plant } from '@/types';
import { unitsSoldByPlant } from './logic';

/** Date-range + aggregation helpers for the Owner Dashboard (Module 11). */

export type Period = 'today' | 'week' | 'month' | 'year';

/** Start-of-period epoch ms for a given period, relative to `now`. */
export function periodStart(period: Period, now = new Date()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  switch (period) {
    case 'today':
      return d.getTime();
    case 'week': {
      const day = (d.getDay() + 6) % 7; // Monday = 0
      d.setDate(d.getDate() - day);
      return d.getTime();
    }
    case 'month':
      d.setDate(1);
      return d.getTime();
    case 'year':
      d.setMonth(0, 1);
      return d.getTime();
  }
}

export const billsInPeriod = (bills: Bill[], period: Period, now = new Date()): Bill[] => {
  const start = periodStart(period, now);
  return bills.filter((b) => b.date >= start);
};

/** Total revenue for a period (6.1 Sales Summary). */
export const revenue = (bills: Bill[]): number => bills.reduce((s, b) => s + b.grandTotal, 0);

/** Sales summary across all four periods. */
export function salesSummary(bills: Bill[], now = new Date()): Record<Period, number> {
  return {
    today: revenue(billsInPeriod(bills, 'today', now)),
    week: revenue(billsInPeriod(bills, 'week', now)),
    month: revenue(billsInPeriod(bills, 'month', now)),
    year: revenue(billsInPeriod(bills, 'year', now)),
  };
}

/** Ranked plants by units sold (6.2 Top Selling / 6.4 Fast / 6.5 Slow). */
export const rankPlantsBySales = unitsSoldByPlant;

/** 6.3 Monthly Sales Trend — units per plant per calendar month (current year). */
export function monthlyTrend(bills: Bill[], now = new Date()): { month: string; total: number }[] {
  const year = now.getFullYear();
  const months = Array.from({ length: 12 }, (_, m) => ({
    month: new Date(year, m, 1).toLocaleDateString('en-IN', { month: 'short' }),
    total: 0,
  }));
  for (const b of bills) {
    const d = new Date(b.date);
    if (d.getFullYear() !== year) continue;
    const units = b.items.reduce((s, it) => s + it.qty, 0);
    months[d.getMonth()].total += units;
  }
  return months;
}

/** 6.6 Inventory Summary. */
export function inventorySummary(plants: Plant[]): { totalPlants: number; totalValue: number } {
  return {
    totalPlants: plants.reduce((s, p) => s + p.quantity, 0),
    totalValue: plants.reduce((s, p) => s + p.quantity * p.sellingPrice, 0),
  };
}

/** Whether ≥ 3 distinct months of sales exist (gate for 6.7 Seasonal Insights). */
export function hasSeasonalData(bills: Bill[]): boolean {
  const months = new Set(bills.map((b) => new Date(b.date).toISOString().slice(0, 7)));
  return months.size >= 3;
}
