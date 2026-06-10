import { useState } from 'react';
import { Upload, Trash2, CheckCircle2 } from 'lucide-react';
import { Screen, Field, PrimaryButton, Card } from '@/components/ui';
import { useData } from '@/state/DataProvider';
import { saveCompany } from '@/lib/repository';
import type { CompanyProfile } from '@/lib/company';

/** Resize an uploaded image to a small data URL so it fits in Firestore. */
function resizeImage(file: File, max = 240): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Canvas not supported'));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function CompanyProfileScreen() {
  const { company } = useData();
  const [form, setForm] = useState<CompanyProfile>(company);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof CompanyProfile) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const logo = await resizeImage(file);
      setForm((f) => ({ ...f, logo }));
    } catch {
      setError('Could not read that image.');
    }
  }

  async function handleSave() {
    setError('');
    if (!form.name.trim()) return setError('Business name is required.');
    setSaving(true);
    try {
      await saveCompany(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="Company Profile" subtitle="Shown on every bill and report">
      {/* Logo */}
      <Card className="mb-4 flex items-center gap-4">
        {form.logo ? (
          <img src={form.logo} alt="Logo" className="h-20 w-20 rounded-xl object-contain" />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--color-mint)] text-3xl">
            🌿
          </div>
        )}
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-[var(--color-leaf)] px-4 py-2 font-semibold text-[var(--color-leaf)] transition hover:bg-[var(--color-mint)]">
            <Upload size={18} /> {form.logo ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/*" onChange={onLogo} className="hidden" />
          </label>
          {form.logo && (
            <button
              onClick={() => setForm((f) => ({ ...f, logo: undefined }))}
              className="flex items-center gap-2 text-sm font-semibold text-red-600"
            >
              <Trash2 size={16} /> Remove
            </button>
          )}
        </div>
      </Card>

      <Field label="Business Name" value={form.name} onChange={set('name')} placeholder="Devakusuma Nursery Gardens" />
      <Field label="Tagline" value={form.tagline ?? ''} onChange={set('tagline')} placeholder="Plants for every garden" />
      <Field label="Address" value={form.address ?? ''} onChange={set('address')} placeholder="Street, City, State, PIN" />
      <Field label="Phone" type="tel" inputMode="tel" value={form.phone ?? ''} onChange={set('phone')} placeholder="e.g. 98765 43210" />
      <Field label="Email" type="email" value={form.email ?? ''} onChange={set('email')} placeholder="nursery@example.com" />
      <Field label="GSTIN (optional)" value={form.gstin ?? ''} onChange={set('gstin')} placeholder="22AAAAA0000A1Z5" />

      {error && <p className="mb-4 font-semibold text-red-600">{error}</p>}
      {saved && (
        <p className="mb-4 flex items-center gap-2 font-semibold text-[var(--color-leaf)]">
          <CheckCircle2 size={18} /> Saved
        </p>
      )}

      <PrimaryButton onClick={handleSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save Profile'}
      </PrimaryButton>
    </Screen>
  );
}
