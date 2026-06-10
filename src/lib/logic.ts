import type { Plant, BillItem } from '@/types';

/**
 * Pure business logic — no Firebase, no React. Easy to unit-test.
 * These functions encode the rules from the PRD modules.
 */

/** Normalise a name/size for matching ("Areca Palm" / "areca palm" are equal). */
export const norm = (s: string): string => s.trim().toLowerCase().replace(/\s+/g, ' ');

/** Find an existing inventory entry for a plant+size combination. */
export function findEntry(
  plants: Plant[],
  plantName: string,
  size: string,
): Plant | undefined {
  return plants.find((p) => norm(p.plantName) === norm(plantName) && norm(p.size) === norm(size));
}

/** Module 08 — value of a single entry. */
export const entryValue = (p: Pick<Plant, 'quantity' | 'sellingPrice'>): number =>
  p.quantity * p.sellingPrice;

/** Module 08 — grand total nursery stock value. */
export const totalStockValue = (plants: Plant[]): number =>
  plants.reduce((sum, p) => sum + entryValue(p), 0);

/** Module 09 — instant search by name and/or size (partial, case-insensitive). */
export function searchPlants(plants: Plant[], query: string): Plant[] {
  const q = norm(query);
  if (!q) return plants;
  return plants.filter(
    (p) => norm(p.plantName).includes(q) || norm(p.size).includes(q) || norm(`${p.plantName} ${p.size}`).includes(q),
  );
}

/** Module 10 — entries at or below their low-stock threshold. */
export const lowStockEntries = (plants: Plant[]): Plant[] =>
  plants.filter((p) => p.quantity < p.minThreshold);

/** Format ₹ in Indian numbering (e.g. ₹1,41,500). */
export const formatRupees = (n: number): string =>
  `₹${new Intl.NumberFormat('en-IN').format(Math.round(n))}`;

/** Build a sequential invoice number from a counter, e.g. 42 -> "INV-0042". */
export const formatInvoiceNo = (counter: number): string =>
  `INV-${String(counter).padStart(4, '0')}`;

/** Compute a single bill line total. */
export const lineTotal = (qty: number, rate: number): number => qty * rate;

/** Grand total for a set of bill items. */
export const billGrandTotal = (items: BillItem[]): number =>
  items.reduce((sum, it) => sum + it.lineTotal, 0);

/**
 * Module 04 — validate a growth/size-change move.
 * Returns an error string if invalid, otherwise null.
 */
export function validateSizeChange(
  from: Plant | undefined,
  fromSize: string,
  toSize: string,
  qty: number,
): string | null {
  if (norm(fromSize) === norm(toSize)) return 'From and To sizes must be different.';
  if (qty <= 0) return 'Quantity must be more than zero.';
  if (!from) return 'No stock found for that plant and size.';
  if (qty > from.quantity) return `Only ${from.quantity} available to move.`;
  return null;
}

/** Sales analytics helper — total units sold per plant from a list of bills. */
export function unitsSoldByPlant(
  bills: { items: BillItem[] }[],
): { plantName: string; units: number }[] {
  const map = new Map<string, number>();
  for (const bill of bills) {
    for (const it of bill.items) {
      map.set(it.plantName, (map.get(it.plantName) ?? 0) + it.qty);
    }
  }
  return [...map.entries()]
    .map(([plantName, units]) => ({ plantName, units }))
    .sort((a, b) => b.units - a.units);
}
