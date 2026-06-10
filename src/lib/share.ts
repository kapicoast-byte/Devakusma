import type { Bill } from '@/types';
import { formatRupees } from './logic';
import { invoiceAsFile } from './invoice';

/** Plain-text summary used as the WhatsApp message body. */
function billMessage(bill: Bill): string {
  const lines = bill.items.map((it) => `• ${it.plantName} ${it.size} × ${it.qty} = ${formatRupees(it.lineTotal)}`);
  return [
    `🌿 Devakusuma Nursery Gardens`,
    `Invoice ${bill.invoiceNo}`,
    `Customer: ${bill.customerName}`,
    '',
    ...lines,
    '',
    `Total: ${formatRupees(bill.grandTotal)}`,
    'Thank you!',
  ].join('\n');
}

/**
 * Share the invoice via WhatsApp.
 * Prefers the Web Share API (attaches the actual PDF on mobile); falls back to a
 * wa.me deep link with the text summary when file sharing isn't available.
 */
export async function shareOnWhatsApp(bill: Bill): Promise<void> {
  const text = billMessage(bill);

  try {
    const file = await invoiceAsFile(bill);
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], text, title: `Invoice ${bill.invoiceNo}` });
      return;
    }
  } catch {
    // fall through to wa.me link
  }

  const phone = (bill.mobile ?? '').replace(/\D/g, '');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
}
