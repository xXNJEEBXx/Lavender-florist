import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useCart } from '../../store/CartContext';
import Footer from './Footer';

export default function MainLayout() {
  const { openLoginModal, isAuthenticated, user, logout, isLoading } = useAuth();
  const { itemCount } = useCart();
  
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-primary-100/50 h-20 flex items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-2">
          <Link to="/">
            <img src="/logo.png" alt="Lavender Florist" className="h-12 w-12 object-contain" />
          </Link>
          <Link to="/">
            <h1 className="text-2xl font-bold text-primary-900 font-serif tracking-wide hidden sm:block">
              Lavender Florist
            </h1>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-primary-900/80 font-medium">
          <Link to="/" className="hover:text-primary-600 transition-colors">الرئيسية</Link>
          <a href="/#products" className="hover:text-primary-600 transition-colors">المنتجات</a>
          {!isLoading && isAuthenticated && (
            <Link to="/my-orders" className="hover:text-primary-600 transition-colors text-primary-950 font-bold">طلباتي</Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors px-2">
            EN
          </button>
          <Link to="/cart" className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Link>
          
          {isLoading ? (
            <div className="h-10 w-10 rounded-full bg-primary-50 animate-pulse border border-primary-100"></div>
          ) : isAuthenticated ? (
            <div className="relative group">
              <Link 
                to={user?.role === 'admin' ? '/admin' : '/profile'}
                className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-800 font-bold cursor-pointer transition-colors border border-primary-200"
              >
                {user?.name?.charAt(0) || 'U'}
              </Link>
              
              {/* Simple Dropdown on Hover */}
              <div className="absolute left-0 mt-2 w-48 bg-white border border-primary-100 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                <Link to={user?.role === 'admin' ? '/admin' : '/profile'} className="block px-4 py-3 text-sm text-primary-800 hover:bg-primary-50">
                  {user?.role === 'admin' ? 'لوحة التحكم' : 'حسابي'}
                </Link>
                <Link to="/my-orders" className="block px-4 py-3 text-sm text-primary-800 hover:bg-primary-50">
                  طلباتي
                </Link>
                <button 
                  onClick={() => {
                    logout();
                  }}
                  className="w-full text-right px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 border-t border-primary-50"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={openLoginModal} 
              className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
          )}
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
