import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Flower2 } from 'lucide-react';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../store/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-50 via-background to-rose-50" />
      <div className="absolute top-20 right-20 w-64 h-64 bg-lavender-200/30 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-rose-200/20 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl shadow-lavender-500/10 border border-border p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-lavender-400 to-lavender-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-lavender-500/25"
            >
              <Flower2 className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-bold text-text">تسجيل الدخول</h1>
            <p className="text-text-muted mt-1">أهلاً بك في لافندر فلوريست</p>
          </div>

          {/* Google Login */}
          <button className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-xl border-2 border-border hover:border-lavender-300 hover:bg-lavender-50 transition-all duration-300 mb-6 cursor-pointer">
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-semibold text-text">تسجيل الدخول بواسطة Google</span>
          </button>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-text-muted">أو</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 text-danger text-sm p-4 rounded-xl border border-red-100"
              >
                {error}
              </motion.div>
            )}

            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              icon={<Mail className="w-5 h-5" />}
              required
              dir="ltr"
            />

            <div className="relative">
              <Input
                label="كلمة المرور"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                icon={<Lock className="w-5 h-5" />}
                required
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-4 top-[42px] text-text-muted hover:text-text cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-border text-lavender-500 focus:ring-lavender-400" />
                <span className="text-text-muted">تذكرني</span>
              </label>
              <a href="#" className="text-lavender-600 hover:text-lavender-700 font-semibold">
                نسيت كلمة المرور؟
              </a>
            </div>

            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              تسجيل الدخول
            </Button>
          </form>

          {/* Register Link */}
          <p className="text-center text-sm text-text-muted mt-6">
            ليس لديك حساب؟{' '}
            <Link to="/register" className="text-lavender-600 font-semibold hover:text-lavender-700">
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
