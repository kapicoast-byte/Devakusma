/**
 * Core domain types for the Devakusuma Nursery app.
 * Kept jargon-free to mirror how nursery staff think about the work.
 */

/** A single inventory entry = one plant at one size. */
export interface Plant {
  /** Firestore document id (never shown to users). */
  id: string;
  plantName: string; // e.g. "Areca Palm"
  size: string; // e.g. "2 ft"
  quantity: number; // current count in stock
  sellingPrice: number; // ₹ per plant for this size
  minThreshold: number; // low-stock alert level
  updatedAt: number; // epoch ms
}

/** One line on a sales bill. */
export interface BillItem {
  plantName: string;
  size: string;
  qty: number;
  rate: number; // auto-filled from inventory; never typed by user
  lineTotal: number; // qty * rate
}

/** A customer sales bill / invoice. */
export interface Bill {
  id: string;
  invoiceNo: string; // e.g. "INV-0042"
  customerName: string;
  mobile?: string;
  date: number; // epoch ms of sale
  items: BillItem[];
  grandTotal: number;
  createdAt: number;
}

export type Role = 'farmer' | 'owner';
