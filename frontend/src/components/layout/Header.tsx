import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Search,
  ChevronDown,
  LogOut,
  LayoutDashboard,
  Package,
} from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import Container from '../ui/Container';

const navLinks = [
  { path: '/', label: 'الرئيسية' },
  { path: '/products', label: 'المنتجات' },
  { path: '/about', label: 'من نحن' },
  { path: '/contact', label: 'تواصل معنا' },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        className="sticky top-0 z-40 glass border-b border-white/20"
      >
        <Container>
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <motion.img
                src="/logo.png"
                alt="لافندر فلوريست"
                className="h-10 lg:h-14 w-auto"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              />
              <div className="hidden sm:block">
                <h1 className="font-display text-lg lg:text-xl font-bold text-lavender-700 group-hover:text-lavender-600 transition-colors">
                  Lavender Florist
                </h1>
                <p className="text-xs text-text-muted -mt-1">تنسيق أزهار و تغليف هدايا</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
                    ${
                      isActive(link.path)
                        ? 'text-lavender-700'
                        : 'text-text-light hover:text-lavender-600 hover:bg-lavender-50'
                    }
                  `}
                >
                  {link.label}
                  {isActive(link.path) && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-lavender-100 rounded-xl -z-10"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              {/* Search Button */}
              <Link
                to="/products"
                className="p-2.5 rounded-xl hover:bg-lavender-50 transition-colors text-text-light hover:text-lavender-600"
              >
                <Search className="w-5 h-5" />
              </Link>

              {/* Cart */}
              <Link
                to="/cart"
                className="relative p-2.5 rounded-xl hover:bg-lavender-50 transition-colors text-text-light hover:text-lavender-600"
              >
                <ShoppingBag className="w-5 h-5" />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -left-0.5 bg-lavender-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                    >
                      {itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>

              {/* User Menu */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-lavender-50 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-lavender-400 to-rose-400 flex items-center justify-center text-white text-sm font-bold">
                      {user?.name?.charAt(0)}
                    </div>
                    <ChevronDown className="w-4 h-4 text-text-muted hidden lg:block" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-border overflow-hidden z-50"
                        >
                          <div className="p-4 border-b border-border">
                            <p className="font-semibold text-text">{user?.name}</p>
                            <p className="text-sm text-text-muted">{user?.email}</p>
                          </div>
                          <div className="p-2">
                            {user?.role === 'admin' && (
                              <Link
                                to="/admin"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-lavender-50 transition-colors"
                              >
                                <LayoutDashboard className="w-4 h-4 text-lavender-500" />
                                لوحة التحكم
                              </Link>
                            )}
                            <Link
                              to="/profile"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-lavender-50 transition-colors"
                            >
                              <User className="w-4 h-4 text-lavender-500" />
                              حسابي
                            </Link>
                            <Link
                              to="/my-orders"
                              onClick={() => setIsUserMenuOpen(false)}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-lavender-50 transition-colors"
                            >
                              <Package className="w-4 h-4 text-lavender-500" />
                              طلباتي
                            </Link>
                            <button
                              onClick={() => { logout(); setIsUserMenuOpen(false); }}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm hover:bg-red-50 text-danger transition-colors cursor-pointer"
                            >
                              <LogOut className="w-4 h-4" />
                              تسجيل خروج
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-lavender-500 text-white rounded-xl text-sm font-semibold hover:bg-lavender-600 transition-colors shadow-lg shadow-lavender-500/25"
                >
                  <User className="w-4 h-4" />
                  تسجيل الدخول
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2.5 rounded-xl hover:bg-lavender-50 transition-colors text-text-light cursor-pointer"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </Container>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t border-border/50"
            >
              <div className="bg-white/95 backdrop-blur-lg px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      block px-4 py-3 rounded-xl text-sm font-semibold transition-all
                      ${isActive(link.path) ? 'bg-lavender-100 text-lavender-700' : 'text-text-light hover:bg-lavender-50'}
                    `}
                  >
                    {link.label}
                  </Link>
                ))}
                {!isAuthenticated && (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-4 py-3 rounded-xl text-sm font-semibold bg-lavender-500 text-white text-center mt-3"
                  >
                    تسجيل الدخول
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
