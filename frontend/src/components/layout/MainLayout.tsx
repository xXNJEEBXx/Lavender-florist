import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';

export default function MainLayout() {
  const { openLoginModal } = useAuth();
  
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
          <Link to="/products" className="hover:text-primary-600 transition-colors">المنتجات</Link>
          <Link to="/about" className="hover:text-primary-600 transition-colors">من نحن</Link>
          <Link to="/contact" className="hover:text-primary-600 transition-colors">تواصل معنا</Link>
        </nav>
        <div className="flex items-center gap-4">
          <button className="text-sm font-medium text-primary-700 hover:text-primary-900 transition-colors px-2">
            EN
          </button>
          <Link to="/cart" className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
            <span className="absolute -top-1 -right-1 bg-accent-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">2</span>
          </Link>
          <button 
            onClick={openLoginModal} 
            className="h-10 w-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 hover:bg-primary-100 cursor-pointer transition-colors"
          >
            {/* User Icon Placeholder */}
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-grow">
        <Outlet />
      </main>

      <footer className="bg-primary-950 text-primary-100 py-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/logo.png" alt="Lavender" className="h-10 w-10 brightness-0 invert opacity-90" />
              <h2 className="text-xl font-serif text-white">لافندر فلوريست</h2>
            </div>
            <p className="text-primary-300 text-sm leading-relaxed max-w-sm">
              تنسيق أزهار و تغليف هدايا بلمسة فنية تعبر عن مشاعرك. نحن هنا لنجعل مناسباتكم أكثر جمالاً.
            </p>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">روابط سريعة</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              <li><a href="/products" className="hover:text-white transition-colors">باقات الورد</a></li>
              <li><a href="/products" className="hover:text-white transition-colors">تنسيقات الهدايا</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">الشروط والأحكام</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-semibold mb-4">تواصل معنا</h3>
            <ul className="space-y-2 text-sm text-primary-300">
              <li>واتساب: +966 543282345</li>
              <li>انستقرام: @lavender_florist</li>
              <li>الأحساء، المملكة العربية السعودية</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-primary-800 text-center text-sm text-primary-400">
          © {new Date().getFullYear()} لافندر فلوريست. جميع الحقوق محفوظة.
        </div>
      </footer>
    </div>
  );
}
