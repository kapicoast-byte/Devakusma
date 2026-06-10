import { useMemo, useState } from 'react';
import { Search, Download, Share2, Printer } from 'lucide-react';
import { Screen, Card } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { formatRupees, norm } from '@/lib/logic';
import { downloadInvoice, printInvoice } from '@/lib/invoice';
import { shareOnWhatsApp } from '@/lib/share';

/** Bills history — view past bills and re-export each as a PDF. */
export default function BillsScreen() {
  const { bills } = useData();
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    const query = norm(q);
    if (!query) return bills;
    return bills.filter(
      (b) => norm(b.customerName).includes(query) || norm(b.invoiceNo).includes(query),
    );
  }, [bills, q]);

  return (
    <Screen title="Bills" subtitle={`${bills.length} bill${bills.length === 1 ? '' : 's'} total`}>
      <div className="mb-4 flex items-center gap-2 rounded-xl border-2 border-[var(--color-mint-border)] bg-white px-3">
        <Search className="text-gray-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by customer or bill no…"
          className="w-full py-3 text-lg outline-none"
        />
      </div>

      {results.length === 0 ? (
        <p className="text-center text-gray-500">{bills.length === 0 ? 'No bills yet.' : 'No matches.'}</p>
      ) : (
        <ul className="space-y-3">
          {results.map((b) => (
            <li key={b.id}>
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-gray-800">{b.customerName}</div>
                    <div className="text-sm text-gray-500">
                      {b.invoiceNo} · {new Date(b.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-sm text-gray-500">
                      {b.items.length} item{b.items.length === 1 ? '' : 's'}
                      {b.mobile ? ` · ${b.mobile}` : ''}
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xl font-extrabold text-[var(--color-leaf)]">
                    {formatRupees(b.grandTotal)}
                  </div>
                </div>

                <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                  <ActionButton onClick={() => downloadInvoice(b)} icon={<Download size={18} />} label="PDF" />
                  <ActionButton onClick={() => shareOnWhatsApp(b)} icon={<Share2 size={18} />} label="Share" />
                  <ActionButton onClick={() => printInvoice(b)} icon={<Printer size={18} />} label="Print" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}

function ActionButton({
  onClick,
  icon,
  label,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-mint-border)] py-2 font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]"
    >
      {icon} {label}
    </button>
  );
}
