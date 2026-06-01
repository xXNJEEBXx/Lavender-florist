import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Package,
  Puzzle,
  ShoppingCart,
  Users,
  Ticket,
  ScrollText,
  Settings,
  Sparkles,
  ChevronRight,
  Flower2,
} from 'lucide-react';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'الرئيسية', exact: true },
  { path: '/admin/products', icon: Package, label: 'المنتجات' },
  { path: '/admin/components', icon: Puzzle, label: 'المكونات' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'الطلبات' },
  { path: '/admin/customers', icon: Users, label: 'العملاء' },
  { path: '/admin/coupons', icon: Ticket, label: 'الكوبونات' },
  { path: '/admin/activity-log', icon: ScrollText, label: 'سجل الأحداث' },
  { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
  { path: '/admin/ai-assistant', icon: Sparkles, label: 'مساعد AI' },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (path: string, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`
          fixed lg:static inset-y-0 right-0 z-50
          w-72 bg-white border-l border-border
          lg:translate-x-0 lg:block
          flex flex-col h-screen
        `}
        style={{ transform: undefined }}
      >
        {/* CSS override for large screens */}
        <style>{`
          @media (min-width: 1024px) {
            aside { transform: translateX(0) !important; }
          }
        `}</style>

        {/* Logo */}
        <div className="p-6 border-b border-border">
          <Link to="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center shadow-lg shadow-lavender-500/25">
              <Flower2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-lavender-700">Lavender</h2>
              <p className="text-[10px] text-text-muted -mt-1">لوحة التحكم</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={onClose}
                    className={`
                      relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold
                      transition-all duration-200
                      ${
                        active
                          ? 'text-lavender-700 bg-lavender-50'
                          : 'text-text-light hover:bg-lavender-50/50 hover:text-lavender-600'
                      }
                    `}
                  >
                    {active && (
                      <motion.div
                        layoutId="adminSidebar"
                        className="absolute inset-0 bg-lavender-100 rounded-xl -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-5 h-5 ${active ? 'text-lavender-600' : ''}`} />
                    <span className="flex-1">{item.label}</span>
                    {active && <ChevronRight className="w-4 h-4 text-lavender-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Back to site */}
        <div className="p-4 border-t border-border">
          <Link
            to="/"
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-lavender-50 text-lavender-600 text-sm font-semibold hover:bg-lavender-100 transition-colors"
          >
            العودة للموقع
          </Link>
        </div>
      </motion.aside>
    </>
  );
}
