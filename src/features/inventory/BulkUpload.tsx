import { useState } from 'react';
import { Download, FileSpreadsheet, CheckCircle2, AlertTriangle } from 'lucide-react';
import { PrimaryButton } from '@/components/ui';
import { downloadTemplate, parseInventoryFile, type ParseResult } from '@/lib/bulkImport';
import { bulkUpsertPlants } from '@/lib/repository';

/** Download an Excel template, fill it, upload it — bulk inventory load. */
export default function BulkUpload({ onDone }: { onDone: () => void }) {
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState<ParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    setError('');
    setResult(null);
    setFileName(file.name);
    setParsing(true);
    try {
      setResult(await parseInventoryFile(file));
    } catch {
      setError('Could not read that file. Please use the downloaded template (.xlsx or .csv).');
    } finally {
      setParsing(false);
    }
  }

  async function onImport() {
    if (!result?.valid.length) return;
    setBusy(true);
    setError('');
    try {
      await bulkUpsertPlants(result.valid);
      onDone();
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-3 text-gray-700">
        <li>
          <span className="font-semibold">1. Download the template</span>
          <button
            onClick={() => downloadTemplate()}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-[var(--color-leaf)] py-3 font-bold text-[var(--color-leaf)] transition hover:bg-white"
          >
            <Download size={18} /> Download Excel Template
          </button>
        </li>

        <li>
          <span className="font-semibold">2. Fill in your plants, then upload it</span>
          <label className="mt-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-leaf)] bg-white py-3 font-bold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]">
            <FileSpreadsheet size={18} />
            {fileName ? 'Choose a different file' : 'Choose Filled File'}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFile}
              className="hidden"
            />
          </label>
          {fileName && <p className="mt-1 text-sm text-gray-500">Selected: {fileName}</p>}
        </li>
      </ol>

      {parsing && <p className="text-gray-500">Reading file…</p>}

      {result && (
        <div className="rounded-xl border-2 border-[var(--color-mint-border)] bg-white p-3">
          <div className="flex items-center gap-2 font-bold text-[var(--color-leaf)]">
            <CheckCircle2 size={18} /> {result.valid.length} plant
            {result.valid.length === 1 ? '' : 's'} ready to import
          </div>
          {result.errors.length > 0 && (
            <div className="mt-2 text-amber-700">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={16} /> {result.errors.length} row
                {result.errors.length === 1 ? '' : 's'} skipped
              </div>
              <ul className="mt-1 text-sm">
                {result.errors.slice(0, 5).map((er) => (
                  <li key={er.row}>Row {er.row}: {er.message}</li>
                ))}
                {result.errors.length > 5 && <li>…and {result.errors.length - 5} more</li>}
              </ul>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Importing sets each plant + size to the quantity and price in the sheet (existing
            matches are overwritten).
          </p>
        </div>
      )}

      {error && <p className="font-semibold text-red-600">{error}</p>}

      <PrimaryButton onClick={onImport} disabled={busy || !result?.valid.length}>
        {busy ? 'Importing…' : result?.valid.length ? `Import ${result.valid.length} Plants` : 'Import'}
      </PrimaryButton>
    </div>
  );
}
