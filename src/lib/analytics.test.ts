import { describe, it, expect } from 'vitest';
import { periodStart, billsInPeriod, revenue, salesSummary, hasSeasonalData } from './analytics';
import type { Bill } from '@/types';

const bill = (date: number, total: number): Bill => ({
  id: String(date),
  invoiceNo: 'INV-0001',
  customerName: 'Test',
  date,
  items: [],
  grandTotal: total,
  createdAt: date,
});

describe('analytics periods', () => {
  const now = new Date('2026-06-10T12:00:00');

  it('computes start of today/month/year', () => {
    expect(new Date(periodStart('today', now)).getHours()).toBe(0);
    expect(new Date(periodStart('month', now)).getDate()).toBe(1);
    expect(new Date(periodStart('year', now)).getMonth()).toBe(0);
  });

  it('filters bills within a period and sums revenue', () => {
    const bills = [
      bill(new Date('2026-06-10T09:00:00').getTime(), 1000), // today
      bill(new Date('2026-06-01T09:00:00').getTime(), 500), // this month
      bill(new Date('2025-01-01T09:00:00').getTime(), 999), // last year
    ];
    expect(billsInPeriod(bills, 'today', now)).toHaveLength(1);
    expect(revenue(billsInPeriod(bills, 'month', now))).toBe(1500);
    expect(salesSummary(bills, now).year).toBe(1500);
  });

  it('gates seasonal insights on 3 distinct months', () => {
    const oneMonth = [bill(new Date('2026-06-01').getTime(), 1)];
    expect(hasSeasonalData(oneMonth)).toBe(false);
    const threeMonths = [
      bill(new Date('2026-04-01').getTime(), 1),
      bill(new Date('2026-05-01').getTime(), 1),
      bill(new Date('2026-06-01').getTime(), 1),
    ];
    expect(hasSeasonalData(threeMonths)).toBe(true);
  });
});
