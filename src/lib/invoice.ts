import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Content } from 'pdfmake/interfaces';
import type { Bill } from '@/types';
import { formatRupees } from './logic';
import { getCompanyProfile } from './company';

pdfMake.vfs = (pdfFonts as unknown as { vfs: Record<string, string> }).vfs;

const right = (text: string, opts: Record<string, unknown> = {}) =>
  ({ text, alignment: 'right' as const, ...opts });

function buildDoc(bill: Bill): TDocumentDefinitions {
  const company = getCompanyProfile();
  const date = new Date(bill.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Company details block (from the Company Profile screen).
  const companyLines: Content[] = [
    { text: company.name, fontSize: 20, bold: true, color: '#1B5E20' },
  ];
  if (company.tagline) companyLines.push({ text: company.tagline, fontSize: 10, color: '#666' });
  if (company.address) companyLines.push({ text: company.address, fontSize: 10, color: '#444' });
  const contact = [company.phone, company.email].filter(Boolean).join('  •  ');
  if (contact) companyLines.push({ text: contact, fontSize: 10, color: '#444' });
  if (company.gstin) companyLines.push({ text: `GSTIN: ${company.gstin}`, fontSize: 10, color: '#444' });

  const header: Content = company.logo
    ? {
        columns: [
          { image: company.logo, width: 56, height: 56, fit: [56, 56] },
          { stack: companyLines, margin: [10, 0, 0, 0] },
        ],
      }
    : { stack: companyLines };

  return {
    pageMargins: [40, 50, 40, 50],
    content: [
      header,
      { text: 'Bill', fontSize: 12, color: '#666', margin: [0, 6, 0, 12] },
      {
        columns: [
          [
            { text: `Bill No: ${bill.invoiceNo}`, bold: true },
            { text: `Date: ${date}` },
          ],
          [
            right(`Customer: ${bill.customerName}`),
            bill.mobile ? right(`Mobile: ${bill.mobile}`) : { text: '' },
          ],
        ],
        margin: [0, 10, 0, 16],
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
