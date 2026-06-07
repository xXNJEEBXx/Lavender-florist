import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { X, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Reset state when opened
  useEffect(() => {
    if (isLoginModalOpen) {
      setStep(1);
      setEmail('');
      setOtp('');
      setError('');
    }
  }, [isLoginModalOpen]);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setError('');
    setIsLoading(true);
    try {
      if (email === 'admin@lavender.com') {
        // Just for direct bypass to admin in demo mode
        await verifyOtp(email, '0000');
        closeLoginModal();
        navigate('/admin');
        return;
      }
      
      await sendOtp(email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء إرسال الرمز.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 4) {
      setError('الرجاء إدخال الرمز المكون من 4 أرقام بشكل صحيح.');
      return;
    }
    
    setError('');
    setIsLoading(true);
    try {
      await verifyOtp(email, otp);
      closeLoginModal();
      
      // Navigate based on user role (you might want to check this dynamically later)
      if (email === 'admin@lavender.com') {
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.response?.data?.errors?.otp?.[0] || 'الرمز غير صحيح.');
    } finally {
      setIsLoading(false);
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
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col z-10"
          >
            {/* Close Button */}
            <button 
              onClick={closeLoginModal}
              className="absolute top-4 left-4 z-50 p-2 bg-primary-50 rounded-full text-primary-900 hover:bg-rose-50 hover:text-rose-500 transition-colors"
            >
              <X size={20} />
            </button>
            
            {/* Back Button (Only on step 2) */}
            {step === 2 && (
              <button 
                onClick={() => setStep(1)}
                className="absolute top-4 right-4 z-50 p-2 bg-primary-50 rounded-full text-primary-900 hover:bg-primary-100 transition-colors"
              >
                <ArrowRight size={20} />
              </button>
            )}

            {/* Content Section */}
            <div className="w-full flex items-center justify-center p-8 bg-white overflow-y-auto min-h-[450px]">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="w-full max-w-sm mt-4"
                  >
                    <div className="mb-8 text-center">
                      <h2 className="text-3xl font-serif font-bold text-primary-950 mb-2">تسجيل الدخول</h2>
                      <p className="text-primary-600 text-sm leading-relaxed">أدخل بريدك الإلكتروني ليصلك رمز الدخول السريع.</p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl text-center border border-rose-100">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleSendOtp} className="space-y-4">
                      <div>
                        <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3.5 rounded-xl border border-primary-200 bg-primary-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-lg text-center font-medium"
                          placeholder="البريد الإلكتروني"
                          required
                          dir="ltr"
                          autoFocus
                        />
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isLoading || !email}
                        className="w-full flex justify-center items-center py-3.5 mt-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'متابعة'}
                      </button>
                      
                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-primary-100"></div></div>
                        <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-primary-500">أو</span></div>
                      </div>
                      
                      <a 
                        href="http://127.0.0.1:8000/api/auth/google/redirect"
                        className="w-full py-3 bg-white border border-primary-200 text-primary-900 rounded-xl font-medium hover:bg-primary-50 transition-colors flex items-center justify-center gap-3 text-sm"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/><path d="M1 1h22v22H1z" fill="none"/></svg>
                        تسجيل الدخول بواسطة جوجل
                      </a>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full max-w-sm mt-4"
                  >
                    <div className="mb-8 text-center">
                      <h2 className="text-3xl font-serif font-bold text-primary-950 mb-2">أدخل الرمز</h2>
                      <p className="text-primary-600 text-sm leading-relaxed">
                        أرسلنا رمز التحقق إلى بريدك
                        <br />
                        <span className="font-bold text-primary-800" dir="ltr">{email}</span>
                      </p>
                    </div>

                    {error && (
                      <div className="mb-4 p-3 bg-rose-50 text-rose-600 text-sm rounded-xl text-center border border-rose-100">
                        {error}
                      </div>
                    )}

                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                      <div dir="ltr">
                        <input 
                          type="text" 
                          maxLength={4}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full px-4 py-4 rounded-xl border border-primary-200 bg-primary-50/50 focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-3xl text-center tracking-[1em] font-bold text-primary-900"
                          placeholder="0000"
                          required
                          autoFocus
                        />
                      </div>
                      
                      <button 
                        type="submit"
                        disabled={isLoading || otp.length !== 4}
                        className="w-full flex justify-center items-center py-3.5 mt-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70"
                      >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'تأكيد الدخول'}
                      </button>

                      <div className="text-center mt-6">
                        <button 
                          type="button" 
                          onClick={handleSendOtp}
                          className="text-primary-600 hover:text-primary-900 text-sm font-medium"
                        >
                          لم يصلك الرمز؟ أعد الإرسال
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
