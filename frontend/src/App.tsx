import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';

import Products from '@/pages/Products';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Checkout from '@/pages/Checkout';
import OrderTracking from '@/pages/OrderTracking';
import AdminLayout from '@/components/layout/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import ProductsList from '@/pages/admin/ProductsList';
import ComponentsList from '@/pages/admin/ComponentsList';
import OrdersList from '@/pages/admin/OrdersList';

import { AuthProvider } from '@/store/AuthContext';
import { CartProvider } from '@/store/CartContext';
import LoginModal from '@/components/ui/LoginModal';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <LoginModal />
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Customer Protected Routes (Basic) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders/:orderNumber" element={<OrderTracking />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="components" element={<ComponentsList />} />
              <Route path="orders" element={<OrdersList />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
