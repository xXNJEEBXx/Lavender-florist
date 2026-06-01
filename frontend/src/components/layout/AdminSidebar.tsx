import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Settings,
  Flower2
} from 'lucide-react';

export default function AdminSidebar() {
  const menuItems = [
    { name: 'لوحة التحكم', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'المنتجات', path: '/admin/products', icon: <Flower2 size={20} /> },
    { name: 'الطلبات', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { name: 'العملاء', path: '/admin/customers', icon: <Users size={20} /> },
    { name: 'الإعدادات', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-white border-l border-primary-100 flex flex-col fixed right-0 top-0 z-40">
      <div className="p-6 flex items-center gap-3 border-b border-primary-50">
        <img src="/logo.png" alt="Lavender Florist" className="h-10 w-10 object-contain" />
        <div>
          <h2 className="font-bold text-primary-950 font-serif">الإدارة</h2>
          <p className="text-xs text-primary-500">Lavender Florist</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive 
                    ? 'bg-primary-50 text-primary-900 border border-primary-100' 
                    : 'text-primary-600 hover:bg-primary-50/50 hover:text-primary-900'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>
      </div>
      
      <div className="p-4 border-t border-primary-50">
        <Link 
          to="/" 
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-xl transition-colors w-full"
        >
          <LogOut size={20} className="rotate-180" />
          العودة للمتجر
        </Link>
      </div>
    </div>
  );
}
