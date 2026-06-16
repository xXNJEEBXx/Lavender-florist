import { NavLink, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Settings,
  Flower2,
  Store,
  Truck,
  Clock,
  CalendarOff,
  Plus,
  ShieldCheck,
  Ticket,
  Bot
} from 'lucide-react';

interface AdminSidebarProps {
  isOpen?: boolean;
  setIsOpen?: (isOpen: boolean) => void;
}

export default function AdminSidebar({ isOpen = true, setIsOpen }: AdminSidebarProps) {
  const menuItems = [
    { name: 'الصفحة الرئيسية', path: '/', icon: <Store size={20} /> },
    { name: 'لوحة التحكم', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'المنتجات', path: '/admin/products', icon: <Flower2 size={20} /> },
    { name: 'الكوبونات', path: '/admin/coupons', icon: <Ticket size={20} /> },
    { name: 'المواد الخام', path: '/admin/components', icon: <Package size={20} /> },
    { name: 'الطلبات', path: '/admin/orders', icon: <ShoppingCart size={20} /> },
    { name: 'إنشاء طلب يدوي', path: '/admin/orders/manual', icon: <Plus size={20} /> },
    { name: 'المناديب', path: '/admin/drivers', icon: <Truck size={20} /> },
    { name: 'العملاء', path: '/admin/customers', icon: <Users size={20} /> },
    { name: 'المشرفين', path: '/admin/admins', icon: <ShieldCheck size={20} /> },
    { name: 'المساعد الذكي', path: '/admin/ai-settings', icon: <Bot size={20} /> },
    { name: 'الإعدادات', path: '/admin/settings', icon: <Settings size={20} /> },
  ];

  const handleLinkClick = () => {
    if (window.innerWidth < 1024 && setIsOpen) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`w-64 h-screen bg-white border-l border-primary-100 flex flex-col fixed right-0 top-0 z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 flex items-center gap-3 border-b border-primary-50">
        <Link to="/">
          <img src="/logo.png" alt="Lavender Florist" className="h-10 w-10 object-contain hover:scale-105 transition-transform" />
        </Link>
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
              onClick={handleLinkClick}
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
            <NavLink onClick={handleLinkClick} to="/admin/working-hours" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <Clock className="w-5 h-5" />
              <span>أوقات العمل</span>
            </NavLink>
            <NavLink onClick={handleLinkClick} to="/admin/breaks" className={({isActive}) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}>
              <CalendarOff className="w-5 h-5" />
              <span>إجازات المشرف</span>
            </NavLink>
        </div>
      </div>
    </div>
  );
}
