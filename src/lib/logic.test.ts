import { describe, it, expect } from 'vitest';
import {
  findEntry,
  entryValue,
  totalStockValue,
  searchPlants,
  lowStockEntries,
  formatRupees,
  formatInvoiceNo,
  validateSizeChange,
  billGrandTotal,
  unitsSoldByPlant,
} from './logic';
import type { Plant, BillItem } from '@/types';

const plant = (over: Partial<Plant>): Plant => ({
  id: 'x',
  plantName: 'Areca Palm',
  size: '2 ft',
  quantity: 250,
  sellingPrice: 250,
  minThreshold: 20,
  updatedAt: 0,
  ...over,
});

const plants: Plant[] = [
  plant({ id: 'a', plantName: 'Areca Palm', size: '2 ft', quantity: 250, sellingPrice: 250 }),
  plant({ id: 'b', plantName: 'Areca Palm', size: '3 ft', quantity: 80, sellingPrice: 500 }),
  plant({ id: 'c', plantName: 'Croton', size: '1 ft', quantity: 150, sellingPrice: 120 }),
  plant({ id: 'd', plantName: 'Ficus', size: '2 ft', quantity: 60, sellingPrice: 350 }),
];

describe('inventory logic', () => {
  it('finds an entry case-insensitively', () => {
    expect(findEntry(plants, 'areca palm', '2 FT')?.id).toBe('a');
    expect(findEntry(plants, 'Unknown', '2 ft')).toBeUndefined();
  });

  it('computes entry and total stock value', () => {
    expect(entryValue(plants[0])).toBe(62_500);
    expect(totalStockValue(plants)).toBe(62_500 + 40_000 + 18_000 + 21_000);
  });

  it('searches by name and size with partial match', () => {
    expect(searchPlants(plants, 'areca')).toHaveLength(2);
    expect(searchPlants(plants, '2 ft')).toHaveLength(2);
    expect(searchPlants(plants, '')).toHaveLength(4);
  });

  it('flags low stock below threshold', () => {
    const low = lowStockEntries([plant({ id: 'l', quantity: 8, minThreshold: 20 })]);
    expect(low).toHaveLength(1);
  });
});

describe('formatting', () => {
  it('formats rupees in Indian grouping', () => {
    expect(formatRupees(141500)).toBe('₹1,41,500');
  });
  it('pads invoice numbers', () => {
    expect(formatInvoiceNo(42)).toBe('INV-0042');
  });
});

describe('size change validation', () => {
  const from = plant({ quantity: 200 });
  it('rejects same size', () => {
    expect(validateSizeChange(from, '1 ft', '1 ft', 10)).toMatch(/different/);
  });
  it('rejects over-quantity', () => {
    expect(validateSizeChange(from, '1 ft', '2 ft', 999)).toMatch(/Only 200/);
  });
  it('accepts a valid move', () => {
    expect(validateSizeChange(from, '1 ft', '2 ft', 100)).toBeNull();
  });
});

describe('billing logic', () => {
  const items: BillItem[] = [
    { plantName: 'Areca Palm', size: '2 ft', qty: 2, rate: 250, lineTotal: 500 },
    { plantName: 'Croton', size: '1 ft', qty: 3, rate: 120, lineTotal: 360 },
  ];
  it('totals a bill', () => {
    expect(billGrandTotal(items)).toBe(860);
  });
  it('ranks plants by units sold', () => {
    const ranked = unitsSoldByPlant([{ items }]);
    expect(ranked[0]).toEqual({ plantName: 'Croton', units: 3 });
  });
});
