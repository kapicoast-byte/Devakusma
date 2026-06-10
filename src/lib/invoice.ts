import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Bill } from '@/types';
import { formatRupees } from './logic';

pdfMake.vfs = (pdfFonts as unknown as { vfs: Record<string, string> }).vfs;

const NURSERY_NAME = 'Devakusuma Nursery';
const right = (text: string, opts: Record<string, unknown> = {}) =>
  ({ text, alignment: 'right' as const, ...opts });

function buildDoc(bill: Bill): TDocumentDefinitions {
  const date = new Date(bill.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return {
    pageMargins: [40, 50, 40, 50],
    content: [
      { text: `🌿 ${NURSERY_NAME}`, fontSize: 20, bold: true, color: '#1B5E20' },
      { text: 'Sales Invoice', fontSize: 12, color: '#666', margin: [0, 0, 0, 12] },
      {
        columns: [
          [
            { text: `Invoice No: ${bill.invoiceNo}`, bold: true },
            { text: `Date: ${date}` },
          ],
          [
            right(`Customer: ${bill.customerName}`),
            bill.mobile ? right(`Mobile: ${bill.mobile}`) : { text: '' },
          ],
        ],
        margin: [0, 0, 0, 16],
      },
      {
        table: {
          headerRows: 1,
          widths: ['*', 'auto', 'auto', 'auto', 'auto'],
          body: [
            [
              { text: 'Plant', bold: true, fillColor: '#E8F5E9' },
              { text: 'Size', bold: true, fillColor: '#E8F5E9' },
              right('Qty', { bold: true, fillColor: '#E8F5E9' }),
              right('Rate', { bold: true, fillColor: '#E8F5E9' }),
              right('Total', { bold: true, fillColor: '#E8F5E9' }),
            ],
            ...bill.items.map((it) => [
              it.plantName,
              it.size,
              right(String(it.qty)),
              right(formatRupees(it.rate)),
              right(formatRupees(it.lineTotal)),
            ]),
          ],
        },
        layout: 'lightHorizontalLines',
      },
      {
        text: `Grand Total: ${formatRupees(bill.grandTotal)}`,
        fontSize: 16,
        bold: true,
        color: '#1B5E20',
        alignment: 'right',
        margin: [0, 16, 0, 0],
      },
      { text: 'Thank you for your business!', italics: true, color: '#666', margin: [0, 24, 0, 0] },
    ],
    defaultStyle: { fontSize: 11 },
  };
}

/** Trigger a download of the invoice PDF. */
export function downloadInvoice(bill: Bill): void {
  pdfMake.createPdf(buildDoc(bill)).download(`${bill.invoiceNo}.pdf`);
}

/** Open the print dialog for the invoice PDF. */
export function printInvoice(bill: Bill): void {
  pdfMake.createPdf(buildDoc(bill)).print();
}

/** Get the invoice PDF as a File for the Web Share API (WhatsApp). */
export function invoiceAsFile(bill: Bill): Promise<File> {
  return new Promise((resolve) => {
    pdfMake.createPdf(buildDoc(bill)).getBlob((blob: Blob) => {
      resolve(new File([blob], `${bill.invoiceNo}.pdf`, { type: 'application/pdf' }));
    });
  });
}
