import { motion } from 'framer-motion';

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100 to-accent-50 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover blur-[6px] opacity-70"
          >
            <source src="/Video image display.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-50/80 via-transparent to-primary-100/30"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center text-center pt-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6 inline-block rounded-full bg-white/70 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-primary-800 border border-white/50 shadow-sm"
          >
            عالم من الجمال يزهر بين يديك 🌸
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-6xl md:text-8xl font-bold text-primary-950 font-serif mb-6 leading-tight drop-shadow-sm tracking-tight"
          >
            Lavender Florist
            <span className="block text-3xl md:text-4xl mt-4 text-primary-800 font-serif italic drop-shadow-sm font-medium">للهدايا لغة لا تحتاج لكلمات</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-primary-800 max-w-2xl mb-10 leading-relaxed"
          >
            نقدم لك أرقى التنسيقات من الورود الطبيعية والهدايا الفاخرة التي تصنع لحظات لا تُنسى في كل مناسباتك.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <button className="px-8 py-4 bg-primary-800 text-white rounded-xl font-semibold text-lg hover:bg-primary-900 transition-all shadow-lg shadow-primary-900/20 transform hover:-translate-y-1">
              تسوق الآن
            </button>
            <button className="px-8 py-4 bg-white text-primary-800 border border-primary-200 rounded-xl font-semibold text-lg hover:bg-primary-50 transition-all shadow-sm">
              تصفح التنسيقات
            </button>
          </motion.div>
        </div>
      </section>

      {/* Categories Placeholder */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif text-primary-900 font-bold mb-4">تصنيفاتنا المميزة</h2>
            <p className="text-primary-600">اختر من مجموعتنا المتنوعة لتناسب ذوقك</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['باقات ورد', 'فازات', 'تغليف هدايا', 'بوكسات'].map((cat, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="aspect-square rounded-2xl bg-primary-50 flex items-center justify-center p-6 text-center cursor-pointer border border-primary-100 hover:border-primary-300 transition-colors shadow-sm hover:shadow-md"
              >
                <h3 className="text-xl font-medium text-primary-800">{cat}</h3>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured Products Placeholder */}
      <section className="py-20 bg-primary-50/50 border-t border-primary-100">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-serif text-primary-900 font-bold mb-2">وصل حديثاً</h2>
              <p className="text-primary-600">أحدث التنسيقات المصممة بحب</p>
            </div>
            <a href="/products" className="text-primary-700 font-medium hover:text-primary-900 underline underline-offset-4 decoration-primary-300">عرض الكل</a>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="group bg-white rounded-2xl overflow-hidden border border-primary-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="aspect-[4/5] bg-primary-100 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center text-primary-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m8 14 4-4 4 4"/></svg>
                  </div>
                </div>
                <div className="p-5">
                  <div className="text-xs text-primary-500 mb-1">باقات ورد</div>
                  <h3 className="text-lg font-semibold text-primary-900 mb-2">باقة السعادة {item}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-xl font-bold text-accent-700">150 ر.س</span>
                    <button className="h-10 w-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center hover:bg-primary-800 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
