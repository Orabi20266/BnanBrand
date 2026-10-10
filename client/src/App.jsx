import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';

import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import ProductForm from './pages/admin/ProductForm.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminOrderDetail from './pages/admin/AdminOrderDetail.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';

/**
 * لوحة تحكم BnanBrand فقط — تُقدَّم تحت المسار /admin
 * واجهة المتجر نفسها موقعك الثابت في جذر المشروع.
 */
export default function App() {
  return (
    <Routes>
      <Route path="login" element={<AdminLogin />} />

      <Route
        path=""
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="products/new" element={<ProductForm />} />
        <Route path="products/:id/edit" element={<ProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="orders/:id" element={<AdminOrderDetail />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="*" element={<Navigate to="" replace />} />
      </Route>
    </Routes>
  );
}
