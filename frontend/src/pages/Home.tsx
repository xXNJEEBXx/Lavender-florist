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
            className="absolute inset-0 w-full h-full object-cover blur-[8px] opacity-80 scale-105"
          >
            <source src="/Video image display.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-primary-950/40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-50 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] min-h-[600px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center bg-white/10 backdrop-blur-md p-10 md:p-16 rounded-[3rem] border border-white/20 shadow-2xl"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-purple-400 font-serif mb-6 leading-tight drop-shadow-2xl tracking-tight"
            >
              Lavender Florist
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-lg md:text-2xl text-white/80 max-w-2xl mb-12 leading-relaxed drop-shadow-md font-light"
            >
              أرقى التنسيقات من الورود الطبيعية والهدايا الفاخرة التي تصنع لحظات لا تُنسى في كل مناسباتك.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <button className="px-10 py-5 bg-white text-primary-950 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-all shadow-xl shadow-white/10 transform hover:-translate-y-1">
                تسوق الآن
              </button>
              <button className="px-10 py-5 bg-primary-900/60 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold text-lg hover:bg-primary-800/80 transition-all shadow-lg transform hover:-translate-y-1">
                تصفح التنسيقات
              </button>
            </motion.div>
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
