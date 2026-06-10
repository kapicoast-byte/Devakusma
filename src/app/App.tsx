import { Routes, Route } from 'react-router-dom';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import PlantsScreen from '@/features/inventory/PlantsScreen';
import AddStockScreen from '@/features/inventory/AddStockScreen';
import CreateBillScreen from '@/features/billing/CreateBillScreen';
import StockValueScreen from '@/features/stockValue/StockValueScreen';
import OwnerDashboard from '@/features/dashboard/OwnerDashboard';
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
      <Route path="/" element={<HomeScreen />} />
      <Route path="/plants" element={<PlantsScreen />} />
      <Route path="/add" element={<AddStockScreen />} />
      <Route path="/bill" element={<CreateBillScreen />} />
      <Route path="/value" element={<StockValueScreen />} />
      <Route path="/dashboard" element={<OwnerDashboard />} />
    </Routes>
  );
}
