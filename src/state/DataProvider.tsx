import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bill, Plant } from '@/types';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured, signInWithGoogle, signOutUser } from '@/lib/firebase';
import { watchBills, watchPlants, watchCompany } from '@/lib/repository';
import { lowStockEntries } from '@/lib/logic';
import {
  DEFAULT_COMPANY,
  setCompanyProfileCache,
  type CompanyProfile,
} from '@/lib/company';

interface DataContextValue {
  plants: Plant[];
  bills: Bill[];
  loading: boolean;
  lowStock: Plant[];
  configured: boolean;
  /** Company profile (name, address, logo…) shown on bills. */
  company: CompanyProfile;
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
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);

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
    let unsubCompany = () => {};
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthChecked(true);
      unsubPlants();
      unsubBills();
      unsubCompany();
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
      unsubCompany = watchCompany((profile) => {
        const merged = { ...DEFAULT_COMPANY, ...profile };
        setCompany(merged);
        setCompanyProfileCache(profile); // keep PDF builders in sync
      });
    });
    return () => {
      unsubAuth();
      unsubPlants();
      unsubBills();
      unsubCompany();
    };
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      plants,
      bills,
      loading,
      lowStock: lowStockEntries(plants),
      configured: isFirebaseConfigured,
      company,
      user,
      authChecked,
      signIn: signInWithGoogle,
      signOut: signOutUser,
    }),
    [plants, bills, loading, user, authChecked, company],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
