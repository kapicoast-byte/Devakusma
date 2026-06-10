import { Routes, Route } from 'react-router-dom';
import HomeScreen from './HomeScreen';
import PlantsScreen from '@/features/inventory/PlantsScreen';
import AddStockScreen from '@/features/inventory/AddStockScreen';
import ChangeSizeScreen from '@/features/growth/ChangeSizeScreen';
import CreateBillScreen from '@/features/billing/CreateBillScreen';
import StockValueScreen from '@/features/stockValue/StockValueScreen';
import OwnerDashboard from '@/features/dashboard/OwnerDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeScreen />} />
      <Route path="/plants" element={<PlantsScreen />} />
      <Route path="/add" element={<AddStockScreen />} />
      <Route path="/grow" element={<ChangeSizeScreen />} />
      <Route path="/bill" element={<CreateBillScreen />} />
      <Route path="/value" element={<StockValueScreen />} />
      <Route path="/dashboard" element={<OwnerDashboard />} />
    </Routes>
  );
}
