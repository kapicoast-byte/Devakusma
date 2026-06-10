import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bill, Plant } from '@/types';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { watchBills, watchPlants } from '@/lib/repository';
import { lowStockEntries } from '@/lib/logic';

interface DataContextValue {
  plants: Plant[];
  bills: Bill[];
  loading: boolean;
  lowStock: Plant[];
  configured: boolean;
  /** The signed-in Google user (null until they sign in). */
  user: User | null;
  /** True until the initial auth state has been resolved. */
  authChecked: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      setAuthChecked(true);
      return;
    }
    // Subscribe to data only once a user is signed in — Firestore rules require
    // an authenticated user, so reads before sign-in would be rejected.
    let unsubPlants = () => {};
    let unsubBills = () => {};
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      unsubPlants();
      unsubBills();
      if (!u) {
        setPlants([]);
        setBills([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      unsubPlants = watchPlants((p) => {
        setPlants(p);
        setLoading(false);
      });
      unsubBills = watchBills(setBills);
    });
    return () => {
      unsubAuth();
      unsubPlants();
      unsubBills();
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      plants,
      bills,
      loading,
      lowStock: lowStockEntries(plants),
      configured: isFirebaseConfigured,
      user,
      authChecked,
      signIn: signInWithGoogle,
      signOut: signOutUser,
    }),
    [plants, bills, loading, user, authChecked],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
