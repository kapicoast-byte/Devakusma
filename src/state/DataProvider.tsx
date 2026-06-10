import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Bill, Plant, Role } from '@/types';
import { isFirebaseConfigured } from '@/lib/firebase';
import { watchBills, watchPlants } from '@/lib/repository';
import { lowStockEntries } from '@/lib/logic';

interface DataContextValue {
  plants: Plant[];
  bills: Bill[];
  loading: boolean;
  lowStock: Plant[];
  configured: boolean;
  /** Owner unlocks the dashboard with the PIN; resets on reload. */
  role: Role;
  unlockOwner: () => void;
  lockOwner: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role>('farmer');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const unsubPlants = watchPlants((p) => {
      setPlants(p);
      setLoading(false);
    });
    const unsubBills = watchBills(setBills);
    return () => {
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
      role,
      unlockOwner: () => setRole('owner'),
      lockOwner: () => setRole('farmer'),
    }),
    [plants, bills, loading, role],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
