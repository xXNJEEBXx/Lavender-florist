import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react';
import Button from '../ui/Button';

export default function HeroSection() {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-lavender-100 via-background to-rose-50" />
      
      {/* Decorative blobs */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-lavender-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lavender-100/20 rounded-full blur-3xl" />
      
      {/* Floating petals */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl sm:text-3xl"
            initial={{
              x: `${Math.random() * 100}%`,
              y: '-10%',
              rotate: 0,
              opacity: 0.6,
            }}
            animate={{
              y: '110%',
              rotate: 360,
              opacity: [0.6, 0.8, 0.4, 0],
            }}
            transition={{
              duration: 8 + Math.random() * 6,
              repeat: Infinity,
              delay: i * 1.5,
              ease: 'linear',
            }}
          >
            {['🌸', '💜', '🌿', '✨', '🌺', '💐', '🌷', '🦋'][i]}
          </motion.div>
        ))}
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Text Content */}
          <div className="text-center lg:text-right">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 bg-lavender-100 text-lavender-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
                <Sparkles className="w-4 h-4" />
                أجمل التنسيقات الزهرية
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6"
            >
              <span className="text-gradient font-display block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl mb-2">
                Lavender
              </span>
              <span className="text-text">لافندر فلوريست</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg sm:text-xl text-text-light leading-relaxed mb-4 max-w-xl mx-auto lg:mx-0"
            >
              تنسيق أزهار و تغليف هدايا
            </motion.p>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-base text-text-muted leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0"
            >
              نقدم لكم أجمل التنسيقات الزهرية والهدايا المميزة لكل المناسبات.
              اجعلوا لحظاتكم أجمل مع لمسة لافندر.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link to="/products">
                <Button size="lg" icon={<ArrowLeft className="w-5 h-5" />}>
                  تصفح المنتجات
                </Button>
              </Link>
              <a
                href="https://wa.me/message/2UZD32P2LOLCM1"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="lg" icon={<MessageCircle className="w-5 h-5" />}>
                  تواصل عبر واتساب
                </Button>
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65 }}
              className="flex items-center gap-8 mt-12 justify-center lg:justify-start"
            >
              {[
                { value: '+500', label: 'طلب مكتمل' },
                { value: '+200', label: 'عميل سعيد' },
                { value: '5★', label: 'تقييم' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-2xl font-bold text-lavender-600">{stat.value}</p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Visual Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex justify-center items-center"
          >
            <div className="relative">
              {/* Main circle */}
              <div className="w-[450px] h-[450px] rounded-full bg-gradient-to-br from-lavender-200 via-rose-100 to-lavender-100 flex items-center justify-center shadow-2xl shadow-lavender-300/30">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0"
                >
                  {/* Orbiting flowers */}
                  {['🌸', '🌺', '🌷', '🌻', '💐', '🌿'].map((flower, i) => (
                    <span
                      key={i}
                      className="absolute text-3xl"
                      style={{
                        top: `${50 + 45 * Math.sin((i * 2 * Math.PI) / 6)}%`,
                        left: `${50 + 45 * Math.cos((i * 2 * Math.PI) / 6)}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      {flower}
                    </span>
                  ))}
                </motion.div>

                {/* Center logo */}
                <motion.img
                  src="/logo.png"
                  alt="لافندر فلوريست"
                  className="w-48 h-48 object-contain relative z-10 drop-shadow-xl"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="absolute -top-4 -right-4 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💐</span>
                  <div>
                    <p className="text-xs text-text-muted">باقات طازجة</p>
                    <p className="text-sm font-bold text-text">يومياً</p>
                  </div>
                </div>
              </motion.div>

              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="absolute -bottom-4 -left-4 bg-white rounded-2xl p-4 shadow-xl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🚚</span>
                  <div>
                    <p className="text-xs text-text-muted">توصيل</p>
                    <p className="text-sm font-bold text-text">سريع</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
