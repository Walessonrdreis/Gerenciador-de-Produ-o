import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardView from './pages/Dashboard';
import ProductsView from './pages/Products';
import MaterialsView from './pages/Materials';
import OrdersView from './pages/Orders';
import ScheduleView from './pages/Schedule';
import PlanningView from './pages/Planning';
import { AppInitializer } from './components/AppInitializer';

export default function App() {
  return (
    <AppInitializer>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardView />} />
            <Route path="produtos" element={<ProductsView />} />
            <Route path="materiais" element={<MaterialsView />} />
            <Route path="pedidos" element={<OrdersView />} />
            <Route path="cronograma" element={<ScheduleView />} />
            <Route path="planejamento" element={<PlanningView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppInitializer>
  );
}