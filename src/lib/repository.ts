import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Bill, BillItem, Plant } from '@/types';
import type { CompanyProfile } from './company';
import { formatInvoiceNo, norm } from './logic';

/**
 * Firestore data layer. All multi-document mutations run in transactions so
 * inventory stays correct even offline (Firestore queues and reconciles).
 */

// Lazy collection refs: built on first use, not at module load. This lets the
// app boot and show the "not configured" banner when Firebase keys are missing,
// instead of throwing during import.
const plantsCol = () => collection(db, 'plants');
const billsCol = () => collection(db, 'bills');

/** Live subscription to the full inventory (cached & offline-capable). */
export function watchPlants(cb: (plants: Plant[]) => void): () => void {
  return onSnapshot(plantsCol(), (snap) => {
    const plants = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Plant, 'id'>) }));
    plants.sort((a, b) => a.plantName.localeCompare(b.plantName) || a.size.localeCompare(b.size));
    cb(plants);
  });
}

/** Live subscription to all bills (for the owner dashboard). */
export function watchBills(cb: (bills: Bill[]) => void): () => void {
  return onSnapshot(billsCol(), (snap) => {
    const bills = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Bill, 'id'>) }));
    bills.sort((a, b) => b.date - a.date);
    cb(bills);
  });
}

/** Stable doc id for a plant+size so Add-Stock merges instead of duplicating. */
const entryId = (plantName: string, size: string): string =>
  `${norm(plantName)}__${norm(size)}`.replace(/[^a-z0-9_]+/g, '-');

/**
 * Module 03 — Add new stock.
 * Merges into an existing plant+size entry, or creates a new one.
 */
export async function addStock(input: {
  plantName: string;
  size: string;
  quantity: number;
  sellingPrice: number;
  minThreshold?: number;
}): Promise<void> {
  const id = entryId(input.plantName, input.size);
  const ref = doc(plantsCol(), id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists()) {
      const cur = snap.data() as Plant;
      tx.update(ref, {
        quantity: cur.quantity + input.quantity,
        sellingPrice: input.sellingPrice, // price can be updated for existing plants
        updatedAt: Date.now(),
      });
    } else {
      tx.set(ref, {
        plantName: input.plantName.trim(),
        size: input.size.trim(),
        quantity: input.quantity,
        sellingPrice: input.sellingPrice,
        minThreshold: input.minThreshold ?? 20,
        updatedAt: Date.now(),
      });
    }
  });
}

/** Update the low-stock threshold for an entry. */
export async function setThreshold(plantId: string, minThreshold: number): Promise<void> {
  await updateDoc(doc(plantsCol(), plantId), { minThreshold, updatedAt: Date.now() });
}

/** Delete an inventory entry (one plant + size). */
export async function deletePlant(plantId: string): Promise<void> {
  await deleteDoc(doc(plantsCol(), plantId));
}

/**
 * Bulk import — create or overwrite inventory entries from an uploaded sheet.
 * Each plant+size's quantity/price/threshold is SET to the sheet value
 * (authoritative), batched to stay within Firestore limits.
 */
export async function bulkUpsertPlants(
  rows: { plantName: string; size: string; quantity: number; sellingPrice: number; minThreshold: number }[],
): Promise<void> {
  const CHUNK = 400;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = writeBatch(db);
    for (const r of rows.slice(i, i + CHUNK)) {
      batch.set(doc(plantsCol(), entryId(r.plantName, r.size)), {
        plantName: r.plantName.trim(),
        size: r.size.trim(),
        quantity: r.quantity,
        sellingPrice: r.sellingPrice,
        minThreshold: r.minThreshold,
        updatedAt: Date.now(),
      });
    }
    await batch.commit();
  }
}

/**
 * Modules 05/06/07 — Create a sales bill.
 * Assigns the next invoice number, writes the bill, and AUTOMATICALLY deducts
 * each item's quantity from inventory — all atomically.
 */
export async function createBill(input: {
  customerName: string;
  mobile?: string;
  items: BillItem[];
}): Promise<Bill> {
  const counterRef = doc(db, 'counters', 'invoice');
  const billRef = doc(billsCol());

  return runTransaction(db, async (tx) => {
    // 1. Read everything first (Firestore requires reads before writes).
    const itemRefs = input.items.map((it) => doc(plantsCol(), entryId(it.plantName, it.size)));
    const itemSnaps = await Promise.all(itemRefs.map((r) => tx.get(r)));
    const counterSnap = await tx.get(counterRef);

    // 2. Validate stock.
    input.items.forEach((it, i) => {
      const snap = itemSnaps[i];
      if (!snap.exists()) throw new Error(`${it.plantName} ${it.size} is not in stock.`);
      const p = snap.data() as Plant;
      if (it.qty > p.quantity) {
        throw new Error(`Only ${p.quantity} ${it.plantName} (${it.size}) available.`);
      }
    });

    // 3. Next invoice number.
    const nextCount = ((counterSnap.data()?.value as number | undefined) ?? 0) + 1;
    const invoiceNo = formatInvoiceNo(nextCount);

    const grandTotal = input.items.reduce((s, it) => s + it.lineTotal, 0);
    const bill: Omit<Bill, 'id'> = {
      invoiceNo,
      customerName: input.customerName.trim(),
      mobile: input.mobile?.trim() || undefined,
      date: Date.now(),
      items: input.items,
      grandTotal,
      createdAt: Date.now(),
    };

    // 4. Writes: counter, bill, and inventory deductions.
    tx.set(counterRef, { value: nextCount }, { merge: true });
    tx.set(billRef, { ...bill, createdAt: serverTimestamp() });
    input.items.forEach((it, i) => {
      const p = itemSnaps[i].data() as Plant;
      tx.update(itemRefs[i], { quantity: p.quantity - it.qty, updatedAt: Date.now() });
    });

    return { id: billRef.id, ...bill };
  });
}

/** One-time fetch of bills within a date range (dashboard reports). */
export async function getBillsBetween(startMs: number, endMs: number): Promise<Bill[]> {
  const q = query(billsCol(), where('date', '>=', startMs), where('date', '<=', endMs));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Bill, 'id'>) }));
}

/** Read or initialise app settings (owner PIN, nursery details). */
export async function saveSetting(key: string, value: unknown): Promise<void> {
  await setDoc(doc(db, 'settings', key), { value }, { merge: true });
}

/** Live subscription to the company profile (settings/company). */
export function watchCompany(cb: (profile: Partial<CompanyProfile>) => void): () => void {
  return onSnapshot(doc(db, 'settings', 'company'), (snap) => {
    cb((snap.data() as Partial<CompanyProfile>) ?? {});
  });
}

/** Save the company profile. */
export async function saveCompany(profile: CompanyProfile): Promise<void> {
  await setDoc(doc(db, 'settings', 'company'), profile, { merge: true });
}
