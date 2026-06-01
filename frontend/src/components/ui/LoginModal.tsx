import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { X } from 'lucide-react';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Close on escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLoginModal();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [closeLoginModal]);

  // Prevent body scrolling when open
  useEffect(() => {
    if (isLoginModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isLoginModalOpen]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // If we are just mocking the login to go to admin
      if (email === 'admin@lavender.com') {
        navigate('/admin');
        closeLoginModal();
        return;
      }
      
      await login(email, password);
      closeLoginModal();
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  return (
    <AnimatePresence>
      {isLoginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" dir="rtl">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeLoginModal}
            className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0 }}
            className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row h-[90vh] lg:h-[600px] z-10"
          >
            {/* Close Button */}
            <button 
              onClick={closeLoginModal}
              className="absolute top-4 right-4 z-50 p-2 bg-white/80 backdrop-blur-md rounded-full text-primary-900 hover:bg-white hover:text-rose-500 transition-colors shadow-sm"
            >
              <X size={20} />
            </button>

            {/* Form Section */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-white overflow-y-auto">
              <div className="w-full max-w-sm">
                <div className="mb-10 text-center lg:text-right">
                  <h2 className="text-3xl lg:text-4xl font-serif font-bold text-primary-950 mb-3">تسجيل الدخول</h2>
                  <p className="text-primary-600 text-sm">مرحباً بعودتك! الرجاء إدخال بياناتك للمتابعة.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
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
                    className="w-full py-3.5 mt-2 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10"
                  >
                    تسجيل الدخول
                  </button>
                  
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-100"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-primary-500">أو</span></div>
                  </div>
                  
                  <button 
                    type="button"
                    className="w-full py-3 bg-white border border-primary-200 text-primary-900 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-3 text-sm"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                    تسجيل الدخول بواسطة جوجل
                  </button>
                </form>
                
                <p className="mt-6 text-center text-primary-600 text-sm">
                  ليس لديك حساب؟ <a href="/register" onClick={() => closeLoginModal()} className="font-semibold text-primary-900 hover:underline">إنشاء حساب جديد</a>
                </p>
              </div>
            </div>
            
            {/* Image Section */}
            <div className="hidden lg:block w-1/2 relative overflow-hidden bg-primary-950">
              <motion.div 
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 2, ease: "easeOut" }}
                className="absolute inset-0"
              >
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-80"
                >
                  <source src="/Video image display.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-primary-950/30 mix-blend-multiply z-10"></div>
              </motion.div>
              
              <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 text-white bg-gradient-to-t from-primary-950/90 via-primary-950/20 to-transparent">
                <h3 className="text-3xl font-serif font-bold mb-3 drop-shadow-md">الورد لغة القلوب</h3>
                <p className="text-lg text-white/90 font-light leading-relaxed">
                  انضم إلينا لتكتشف أجمل التنسيقات والهدايا التي تصنع بهجة لا تُنسى.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
