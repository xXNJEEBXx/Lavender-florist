import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { publicProductsApi } from '../services/api';
import type { Product } from '../types';
import { useAuth } from '../store/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    publicProductsApi.getAll()
      .then(data => {
        setProducts(data.slice(0, 8)); // Show max 8 products on home
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);
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
              <Link to="/products" className="px-10 py-5 bg-white text-primary-950 rounded-2xl font-bold text-lg hover:bg-primary-50 transition-all shadow-xl shadow-white/10 transform hover:-translate-y-1 text-center">
                تسوق الآن
              </Link>
              {isAuthenticated ? (
                <Link to="/my-orders" className="px-10 py-5 bg-primary-900/60 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold text-lg hover:bg-primary-800/80 transition-all shadow-lg transform hover:-translate-y-1 text-center">
                  طلباتي
                </Link>
              ) : (
                <Link to="/products" className="px-10 py-5 bg-primary-900/60 backdrop-blur-md text-white border border-white/30 rounded-2xl font-bold text-lg hover:bg-primary-800/80 transition-all shadow-lg transform hover:-translate-y-1 text-center">
                  تصفح التنسيقات
                </Link>
              )}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Real Products Section */}
      <section className="py-24 bg-white relative">
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
              أحدث الإبداعات
            </motion.h2>
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              className="w-24 h-1 bg-primary-200 mx-auto rounded-full"
            />
          </div>
          
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[4/5] bg-primary-100 rounded-2xl mb-4"></div>
                  <div className="h-4 bg-primary-100 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-primary-100 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-primary-50 rounded-3xl border border-primary-100">
              <p className="text-primary-500 text-lg">لا توجد منتجات حالياً، ترقبوا تشكيلتنا قريباً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
              {products.map((product, index) => {
                const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
                const imageUrl = product.primary_image ? `http://localhost:8000${product.primary_image.image_url}` : null;
                
                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <Link to={`/products/${product.slug}`} className="block relative overflow-hidden rounded-2xl aspect-[4/5] mb-5 bg-primary-50">
                      {imageUrl ? (
                        <img 
                          src={imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary-300 bg-primary-50">
                          <span className="font-serif italic">Lavender</span>
                        </div>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-primary-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Badges */}
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        {hasDiscount && (
                          <span className="bg-white/90 backdrop-blur-sm text-primary-900 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            عرض خاص
                          </span>
                        )}
                        {!product.is_in_stock && (
                          <span className="bg-rose-500/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                            نفدت الكمية
                          </span>
                        )}
                      </div>
                    </Link>
                    
                    <div className="text-center px-2">
                      <div className="text-xs text-primary-400 mb-2 font-medium tracking-wide">
                        {product.category === 'bouquets' ? 'باقة ورد' : product.category === 'gifts' ? 'هدايا' : 'تنسيق'}
                      </div>
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="text-xl font-serif font-bold text-primary-950 mb-3 group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-lg font-bold text-primary-900">
                          {product.price} ر.س
                        </span>
                        {hasDiscount && (
                          <span className="text-sm text-primary-400 line-through decoration-primary-300">
                            {product.compare_at_price} ر.س
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
          
          {products.length > 0 && (
            <div className="mt-16 text-center">
              <Link 
                to="/products"
                className="inline-flex items-center justify-center px-8 py-4 border border-primary-200 text-primary-900 font-bold rounded-full hover:bg-primary-50 transition-colors"
              >
                عرض جميع المجموعات
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
