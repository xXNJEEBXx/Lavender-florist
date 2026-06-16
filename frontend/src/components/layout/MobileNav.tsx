import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Grid3X3, User, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../../store/CartContext';

import { useAuth } from '../../store/AuthContext';
export default function MobileNav() {
  const location = useLocation();
  const { itemCount } = useCart();
  const { isAuthenticated, openLoginModal } = useAuth();

  const navItems = [
    { path: '/', icon: Home, label: 'الرئيسية' },
    { path: '/#products', icon: Grid3X3, label: 'المنتجات' },
    { path: '/cart', icon: ShoppingBag, label: 'السلة', showBadge: true },
    { path: '/contact', icon: MessageCircle, label: 'تواصل' },
    { path: isAuthenticated ? '/my-orders' : '#login', icon: User, label: 'طلباتي' },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' && !location.hash;
    if (path.startsWith('/#')) return location.hash === path.substring(1);
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (e: React.MouseEvent, path: string) => {
    if (path === '#login') {
      e.preventDefault();
      openLoginModal();
    } else if (path.startsWith('/#')) {
      // Allow default behavior for hash links, or you can smooth scroll
    }
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/20">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const isHash = item.path.startsWith('/#');
          
          // Use 'a' tag for hash links and '#login', use 'Link' for regular routes
          const LinkComponent: any = (isHash || item.path === '#login') ? 'a' : Link;
          const hrefProp = (isHash || item.path === '#login') ? { href: isHash ? item.path : '#' } : { to: item.path };

          return (
            <LinkComponent
              key={item.path}
              {...hrefProp}
              onClick={(e: React.MouseEvent) => handleNavClick(e, item.path)}
              className="relative flex flex-col items-center gap-0.5 py-1 px-3"
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-colors ${
                    active ? 'text-lavender-600' : 'text-text-muted'
                  }`}
                />
                {item.showBadge && itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1.5 -left-1.5 bg-lavender-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  >
                    {itemCount}
                  </motion.span>
                )}
              </div>
              <span
                className={`text-[10px] font-semibold transition-colors ${
                  active ? 'text-lavender-600' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
              {active && (
                <motion.div
                  layoutId="mobilenav"
                  className="absolute -bottom-2 w-8 h-1 bg-lavender-500 rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </LinkComponent>
          );
        })}
      </div>
    </nav>
  );
}
