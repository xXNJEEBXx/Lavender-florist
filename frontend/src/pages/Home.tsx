import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useSearchParams } from 'react-router-dom';
import { publicProductsApi } from '../services/api';
import type { Product } from '../types';
import { categories, occasions } from '../data/placeholders';
import ProductCard from '../components/shared/ProductCard';
import ProductDetailModal from '../components/ui/ProductDetailModal';

export default function Home() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const selectedCategory = searchParams.get('category') || 'all';
  const selectedOccasion = searchParams.get('occasion') || 'all';
  const selectedProductSlug = searchParams.get('product');

  const closeProductModal = () => {
    searchParams.delete('product');
    setSearchParams(searchParams);
  };

  useEffect(() => {
    setIsLoading(true);
    publicProductsApi.getAll()
      .then(data => {
        const filtered = data.filter((p: Product) => p.category !== 'cards');
        setProducts(filtered);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleCategorySelect = (id: string) => {
    if (id === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', id);
    }
    setSearchParams(searchParams);
    
    // Scroll to products section smoothly
    const productsSection = document.getElementById('products');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOccasionSelect = (id: string) => {
    if (id === 'all') {
      searchParams.delete('occasion');
    } else {
      searchParams.set('occasion', id);
    }
    setSearchParams(searchParams);
  };

  const displayedProducts = products.filter(p => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchOccasion = selectedOccasion === 'all' || (p.occasions && p.occasions.includes(selectedOccasion as any));
    return matchCategory && matchOccasion;
  });

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
            <source src={`${import.meta.env.VITE_API_BASE_URL || ''}/storage/video-image-display.mp4`} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/40 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-50 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] min-h-[600px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center bg-white/40 backdrop-blur-md p-10 md:p-16 rounded-[3rem] border border-white/40 shadow-xl"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-primary-900 font-serif mb-6 leading-tight drop-shadow-lg tracking-tight"
            >
              Lavender Florist
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-lg md:text-2xl text-primary-800 max-w-2xl mb-12 leading-relaxed font-medium"
            >
              أرقى التنسيقات من الورود الطبيعية والهدايا الفاخرة التي تصنع لحظات لا تُنسى في كل مناسباتك.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <button 
                onClick={() => {
                  setSearchParams({});
                  document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
                }} 
                className="px-10 py-5 bg-white text-primary-950 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-all shadow-xl shadow-white/10 transform hover:-translate-y-1"
              >
                تسوق الآن
              </button>
              <button 
                onClick={() => handleCategorySelect('bouquets')} 
                className="px-10 py-5 bg-primary-900/60 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold text-lg hover:bg-primary-800/80 transition-all shadow-lg transform hover:-translate-y-1"
              >
                تصفح التنسيقات
              </button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Real Products Section */}
      <section id="products" className="py-24 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex flex-col items-center mb-16 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-accent-500 font-serif italic mb-3 tracking-widest"
            >
              The Luxury Collection
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-serif text-primary-950 font-bold mb-6"
            >
              متجر لافندر
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="w-24 h-1 bg-primary-200 mx-auto rounded-full"
            />
          </div>
          
          {/* Two-Axis Filter */}
          <div className="bg-primary-50/50 rounded-3xl p-6 shadow-sm border border-primary-100 mb-12">
            {/* Axis 1: Categories */}
            <div className="mb-6">
              <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary-400"></span>
                لأي نوع؟ (التصنيف)
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategorySelect('all')}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === 'all' ? 'bg-primary-900 text-white shadow-md' : 'bg-white text-primary-700 hover:bg-primary-100 border border-primary-100'}`}
                >
                  الكل
                </button>
                {categories.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleCategorySelect(c.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${selectedCategory === c.id ? 'bg-primary-900 border-primary-900 text-white shadow-md' : 'bg-white border-primary-100 text-primary-700 hover:bg-primary-50'}`}
                  >
                    <span>{c.icon}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-primary-100 mb-6" />

            {/* Axis 2: Occasions */}
            <div>
              <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-400"></span>
                لأي مناسبة؟
              </h3>
              <div className="flex flex-wrap gap-2">
                {occasions.map(o => (
                  <button
                    key={o.id}
                    onClick={() => handleOccasionSelect(o.id)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${selectedOccasion === o.id ? 'bg-accent-50 border-accent-300 text-accent-700 shadow-sm' : 'bg-white border-primary-100 text-primary-600 hover:bg-primary-50'}`}
                  >
                    <span>{o.icon}</span>
                    {o.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-primary-100 rounded-2xl mb-4 border border-primary-50"></div>
                  <div className="h-4 bg-primary-100 rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-primary-100 rounded w-1/4 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : displayedProducts.length === 0 ? (
            <div className="text-center py-20 bg-primary-50 rounded-3xl border border-primary-100">
              <span className="text-6xl mb-4 block">🔍</span>
              <h3 className="text-xl font-bold text-primary-900 mb-2">لا توجد نتائج</h3>
              <p className="text-primary-500 mb-6">لم نتمكن من العثور على منتجات تطابق خياراتك، حاول تغيير الفلاتر.</p>
              <button 
                onClick={() => setSearchParams({})} 
                className="px-6 py-2 bg-primary-100 text-primary-800 rounded-full font-bold hover:bg-primary-200 transition-colors"
              >
                عرض كل المنتجات
              </button>
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              <AnimatePresence>
                {displayedProducts.map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: index < 8 ? index * 0.05 : 0 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      <ProductDetailModal 
        isOpen={!!selectedProductSlug} 
        onClose={closeProductModal} 
        slug={selectedProductSlug} 
      />
    </div>
  );
}
