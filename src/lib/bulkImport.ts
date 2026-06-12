/**
 * Bulk inventory import/export via Excel.
 *
 * The `xlsx` library is dynamically imported so it stays out of the main bundle
 * and only loads when the owner actually uses bulk upload.
 */

export interface ParsedPlant {
  plantName: string;
  size: string;
  quantity: number;
  sellingPrice: number;
  minThreshold: number;
}

export interface ParseResult {
  valid: ParsedPlant[];
  errors: { row: number; message: string }[];
}

const HEADERS = ['Plant Name', 'Size', 'Quantity', 'Selling Price', 'Min Threshold'];

/** Download a ready-to-fill Excel template with example rows. */
export async function downloadTemplate(): Promise<void> {
  const XLSX = await import('xlsx');
  const example = [
    { 'Plant Name': 'Areca Palm', Size: '2 ft', Quantity: 250, 'Selling Price': 250, 'Min Threshold': 20 },
    { 'Plant Name': 'Croton', Size: '1 ft', Quantity: 150, 'Selling Price': 120, 'Min Threshold': 25 },
  ];
  const ws = XLSX.utils.json_to_sheet(example, { header: HEADERS });
  ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  XLSX.writeFile(wb, 'Devakusuma-Inventory-Template.xlsx');
}

/** Export the current inventory as an Excel file (same columns as the template). */
export async function exportInventory(
  plants: { plantName: string; size: string; quantity: number; sellingPrice: number; minThreshold: number }[],
): Promise<void> {
  const XLSX = await import('xlsx');
  const rows = [...plants]
    .sort((a, b) => a.plantName.localeCompare(b.plantName) || a.size.localeCompare(b.size, undefined, { numeric: true }))
    .map((p) => ({
      'Plant Name': p.plantName,
      Size: p.size,
      Quantity: p.quantity,
      'Selling Price': p.sellingPrice,
      'Min Threshold': p.minThreshold,
    }));
  const ws = XLSX.utils.json_to_sheet(rows, { header: HEADERS });
  ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Devakusuma-Inventory-${date}.xlsx`);
}

/** Normalise a header for tolerant matching ("Selling Price (₹)" ≈ "selling price"). */
const normKey = (s: string): string => s.toLowerCase().replace(/[^a-z]/g, '');

/** Read a value from a row by any of several candidate header names. */
function field(row: Record<string, unknown>, keys: Record<string, unknown>, candidates: string[]): unknown {
  for (const c of candidates) {
    const k = keys[normKey(c)] as string | undefined;
    if (k !== undefined && row[k] !== undefined && row[k] !== '') return row[k];
  }
  return undefined;
}

const toNumber = (v: unknown): number =>
  typeof v === 'number' ? v : Number(String(v ?? '').replace(/[^0-9.-]/g, ''));

/** Parse an uploaded .xlsx/.csv file into validated inventory rows. */
export async function parseInventoryFile(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });

  const valid: ParsedPlant[] = [];
  const errors: { row: number; message: string }[] = [];

  rows.forEach((row, i) => {
    const line = i + 2; // +1 for header, +1 for 1-based
    // Map normalised header -> actual key present in this row.
    const keys: Record<string, string> = {};
    for (const k of Object.keys(row)) keys[normKey(k)] = k;

    const plantName = String(field(row, keys, ['Plant Name', 'Plant', 'Name']) ?? '').trim();
    const size = String(field(row, keys, ['Size', 'Plant Size']) ?? '').trim();
    const quantity = toNumber(field(row, keys, ['Quantity', 'Qty']));
    const sellingPrice = toNumber(field(row, keys, ['Selling Price', 'Price', 'Rate']));
    const rawThreshold = field(row, keys, ['Min Threshold', 'Threshold', 'Low Stock']);
    const minThreshold = rawThreshold === undefined ? 20 : toNumber(rawThreshold);

    // Skip fully empty rows silently.
    if (!plantName && !size && !field(row, keys, ['Quantity', 'Qty'])) return;

    if (!plantName) return errors.push({ row: line, message: 'Missing plant name' });
    if (!size) return errors.push({ row: line, message: 'Missing size' });
    if (!Number.isFinite(quantity) || quantity < 0)
      return errors.push({ row: line, message: 'Invalid quantity' });
    if (!Number.isFinite(sellingPrice) || sellingPrice <= 0)
      return errors.push({ row: line, message: 'Invalid selling price' });

    valid.push({
      plantName,
      size,
      quantity,
      sellingPrice,
      minThreshold: Number.isFinite(minThreshold) && minThreshold >= 0 ? minThreshold : 20,
    });
  });

  return { valid, errors };
}
