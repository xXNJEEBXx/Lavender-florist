import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import Home from '@/pages/Home';
import ProductDetail from '@/pages/ProductDetail';
import Cart from '@/pages/Cart';
import Login from '@/pages/Login';
import AuthCallback from '@/pages/AuthCallback';
import Checkout from '@/pages/Checkout';
import OrderTracking from '@/pages/OrderTracking';
import MyOrders from '@/pages/MyOrders';
import SharedSessionReceiver from '@/pages/SharedSessionReceiver';
import AdminLayout from '@/components/layout/AdminLayout';
import Dashboard from '@/pages/admin/Dashboard';
import ProductsList from '@/pages/admin/ProductsList';
import ComponentsList from '@/pages/admin/ComponentsList';
import OrdersList from '@/pages/admin/OrdersList';
import ManualOrder from '@/pages/admin/ManualOrder';
import DriversList from '@/pages/admin/DriversList';
import AdminBreaks from '@/pages/admin/AdminBreaks';
import AdminWorkingHours from '@/pages/admin/AdminWorkingHours';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminsList from '@/pages/admin/AdminsList';
import CouponsList from '@/pages/admin/CouponsList';
import Customers from '@/pages/admin/Customers';
import CustomerDetails from '@/pages/admin/CustomerDetails';
import { AuthProvider } from '@/store/AuthContext';
import { CartProvider } from '@/store/CartContext';
import LoginModal from '@/components/ui/LoginModal';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Toaster position="top-center" />
          <LoginModal />
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            
            {/* Public Links */}
            <Route path="/shared/:token" element={<SharedSessionReceiver />} />
            {/* Kept for backward compatibility with older generated links */}
            <Route path="/complete-order/:token" element={<SharedSessionReceiver />} />

            {/* Customer Protected Routes (Basic) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders/:orderNumber" element={<OrderTracking />} />
              <Route path="/my-orders" element={<MyOrders />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="products" element={<ProductsList />} />
              <Route path="coupons" element={<CouponsList />} />
              <Route path="components" element={<ComponentsList />} />
              <Route path="orders" element={<OrdersList />} />
              <Route path="orders/manual" element={<ManualOrder />} />
              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetails />} />
              <Route path="drivers" element={<DriversList />} />
              <Route path="breaks" element={<AdminBreaks />} />
              <Route path="working-hours" element={<AdminWorkingHours />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="admins" element={<AdminsList />} />
            </Route>
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
