import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import type { Bill, Plant } from '@/types';
import { formatRupees, lowStockEntries } from './logic';
import { billsInPeriod, revenue, rankPlantsBySales, inventorySummary } from './analytics';

pdfMake.vfs = (pdfFonts as unknown as { vfs: Record<string, string> }).vfs;

/** Module 6.8 — one-click Monthly Business Report PDF. */
export function downloadMonthlyReport(bills: Bill[], plants: Plant[]): void {
  const monthBills = billsInPeriod(bills, 'month');
  const ranked = rankPlantsBySales(monthBills);
  const inv = inventorySummary(plants);
  const low = lowStockEntries(plants);
  const monthName = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const section = (title: string, body: Content): Content[] => [
    { text: title, fontSize: 13, bold: true, color: '#1B5E20', margin: [0, 12, 0, 4] },
    body,
  ];

  const doc: TDocumentDefinitions = {
    pageMargins: [40, 50, 40, 50],
    content: [
      { text: '🌿 Devakusuma Nursery', fontSize: 20, bold: true, color: '#1B5E20' },
      { text: `Monthly Business Report — ${monthName}`, fontSize: 12, color: '#666' },

      ...section('Total Sales Revenue', {
        text: formatRupees(revenue(monthBills)),
        fontSize: 16,
        bold: true,
      }),
      ...section('Top Selling Plant', {
        text: ranked[0] ? `${ranked[0].plantName} — ${ranked[0].units} units` : 'No sales this month',
      }),
      ...section('Current Inventory Value', { text: formatRupees(inv.totalValue) }),
      ...section('Fast Moving Plants', {
        ul: ranked.slice(0, 5).map((r) => `${r.plantName} — ${r.units} units`),
      }),
      ...section('Slow Moving Plants', {
        ul: [...ranked].reverse().slice(0, 5).map((r) => `${r.plantName} — ${r.units} units`),
      }),
      ...section('Low Stock Plants', {
        ul: low.length
          ? low.map((p) => `${p.plantName} ${p.size} — ${p.quantity} left (threshold ${p.minThreshold})`)
          : ['None'],
      }),
    ],
    defaultStyle: { fontSize: 11 },
  };

  pdfMake.createPdf(doc).download(`Devakusuma-Report-${monthName.replace(/\s/g, '-')}.pdf`);
}
