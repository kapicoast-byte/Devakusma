import { Routes, Route } from 'react-router-dom';
import AppLayout from './AppLayout';
import LoginScreen from './LoginScreen';
import DashboardScreen from '@/features/dashboard/DashboardScreen';
import InventoryScreen from '@/features/inventory/InventoryScreen';
import CreateBillScreen from '@/features/billing/CreateBillScreen';
import BillsScreen from '@/features/billing/BillsScreen';
import StockValueScreen from '@/features/stockValue/StockValueScreen';
import { useData } from '@/state/DataProvider';

export default function App() {
  const { configured, authChecked, user } = useData();

  // Wait for Firebase to report the initial auth state to avoid a login flash.
  if (configured && !authChecked) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[var(--color-mint)] text-gray-500">
        Loading…
      </div>
    );
  }

  // Require Google sign-in before showing the app.
  if (configured && !user) {
    return <LoginScreen />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardScreen />} />
        <Route path="/inventory" element={<InventoryScreen />} />
        <Route path="/bill" element={<CreateBillScreen />} />
        <Route path="/bills" element={<BillsScreen />} />
        <Route path="/value" element={<StockValueScreen />} />
      </Route>
    </Routes>
  );
}
