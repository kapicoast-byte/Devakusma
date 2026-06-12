import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { useData } from '@/state/DataProvider';

/** Google sign-in gate shown before the app loads. */
export default function LoginScreen() {
  const { signIn, configured } = useData();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setError('');
    setBusy(true);
    try {
      await signIn();
    } catch (e) {
      setError((e as Error).message || 'Sign-in failed. Please try again.');
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-[var(--bg)] px-5">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-mint)] text-4xl">
          🌿
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Devakusuma Nursery Gardens
        </h1>
        <p className="mb-7 mt-1.5 text-gray-500">Sign in to manage your nursery.</p>

        {!configured ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Firebase isn't connected yet. Add your Firebase keys to enable sign-in.
          </div>
        ) : (
          <>
            <button
              onClick={handleSignIn}
              disabled={busy}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-white px-6 py-3.5 text-base font-semibold text-gray-800 shadow-sm transition hover:bg-gray-50 active:scale-[0.99] disabled:opacity-50"
            >
              <LogIn size={20} className="text-[var(--color-leaf)]" />
              {busy ? 'Signing in…' : 'Sign in with Google'}
            </button>
            {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
