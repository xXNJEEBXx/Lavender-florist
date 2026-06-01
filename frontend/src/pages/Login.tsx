import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder login logic
    if (email === 'admin@lavender.com') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-[80vh] flex">
      {/* Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-24 bg-white relative">
        <div className="absolute top-8 right-8">
          <Link to="/" className="text-primary-600 hover:text-primary-900 font-medium flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            العودة للمتجر
          </Link>
        </div>
        
        <div className="w-full max-w-md">
          <div className="mb-10 text-center lg:text-right">
            <h1 className="text-4xl font-serif font-bold text-primary-950 mb-4">تسجيل الدخول</h1>
            <p className="text-primary-600">مرحباً بعودتك! الرجاء إدخال بياناتك للمتابعة.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-primary-900 mb-2">البريد الإلكتروني</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-primary-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                placeholder="example@email.com"
                required
                dir="ltr"
              />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-primary-900">كلمة المرور</label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-900 font-medium">نسيت كلمة المرور؟</a>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-primary-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                placeholder="••••••••"
                required
                dir="ltr"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10"
            >
              تسجيل الدخول
            </button>
            
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-100"></div></div>
              <div className="relative flex justify-center text-sm"><span className="px-4 bg-white text-primary-500">أو</span></div>
            </div>
            
            <button 
              type="button"
              className="w-full py-3.5 bg-white border border-primary-200 text-primary-900 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
              تسجيل الدخول بواسطة جوجل
            </button>
          </form>
          
          <p className="mt-8 text-center text-primary-600">
            ليس لديك حساب؟ <Link to="/register" className="font-semibold text-primary-900 hover:underline">إنشاء حساب جديد</Link>
          </p>
        </div>
      </div>
      
      {/* Image Section */}
      <div className="hidden lg:block w-1/2 relative bg-primary-100 overflow-hidden">
        <motion.div 
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-primary-900/20 mix-blend-multiply z-10"></div>
          {/* We use a beautiful floral gradient as a placeholder for the login image */}
          <div className="w-full h-full bg-gradient-to-br from-pink-300 via-purple-400 to-indigo-500"></div>
        </motion.div>
        
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-16 text-white bg-gradient-to-t from-primary-950/80 via-primary-950/20 to-transparent">
          <h2 className="text-4xl font-serif font-bold mb-4 drop-shadow-md">الورد لغة القلوب</h2>
          <p className="text-xl text-white/90 font-light max-w-md leading-relaxed">
            انضم إلينا لتكتشف أجمل التنسيقات والهدايا التي تصنع بهجة لا تُنسى.
          </p>
        </div>
      </div>
    </div>
  );
}
