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
    <div className="flex min-h-full flex-col items-center justify-center bg-[var(--color-mint)] px-6 text-center">
      <div className="mb-6 text-6xl">🌿</div>
      <h1 className="text-3xl font-extrabold text-[var(--color-leaf)]">Devakusuma Nursery Gardens</h1>
      <p className="mb-8 mt-2 text-gray-600">Sign in to manage your nursery.</p>

      {!configured ? (
        <div className="max-w-sm rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-amber-900">
          Firebase isn't connected yet. Add your Firebase keys to enable sign-in.
        </div>
      ) : (
        <>
          <button
            onClick={handleSignIn}
            disabled={busy}
            className="flex items-center justify-center gap-3 rounded-2xl border-2 border-[var(--color-leaf)] bg-white px-8 py-4 text-lg font-bold text-[var(--color-leaf)] shadow-md transition active:scale-[0.98] disabled:opacity-50"
          >
            <LogIn /> {busy ? 'Signing in…' : 'Sign in with Google'}
          </button>
          {error && <p className="mt-4 max-w-sm font-semibold text-red-600">{error}</p>}
        </>
      )}
    </div>
  );
}
