import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts } from '../services/api';
import type { Product } from '../types';
import { ShoppingBag, ArrowLeft } from 'lucide-react';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(data => {
        setProducts(data);
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const featuredProducts = products.slice(0, 3);
  const otherProducts = products.slice(3);

  return (
    <div className="bg-primary-50/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-primary-100 to-accent-50 py-20 lg:py-32">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="absolute inset-0 w-full h-full object-cover blur-[4px] opacity-70 scale-105"
          >
            <source src="/Video image display.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-white/30 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-transparent"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center h-[calc(100vh-80px)] min-h-[600px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center p-10 md:p-16 rounded-[3rem]"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="text-6xl md:text-8xl lg:text-9xl font-bold text-white font-serif mb-6 leading-tight drop-shadow-2xl tracking-tight"
            >
              Lavender Florist
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="text-lg md:text-2xl text-white/90 max-w-2xl mb-12 leading-relaxed font-medium drop-shadow-md"
            >
              لغة الورود هي الأصدق.. تصاميم استثنائية تُحاكي مشاعرك وتُخلّد لحظاتك السعيدة.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto"
            >
              <a href="#collection" className="px-10 py-5 bg-white text-primary-950 rounded-full font-bold text-lg hover:bg-primary-50 transition-all shadow-xl transform hover:-translate-y-1 flex items-center justify-center gap-3">
                <ShoppingBag className="w-5 h-5" />
                اكتشف التشكيلة
              </a>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid - Featured Collection */}
      <section id="collection" className="py-24 max-w-7xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-serif text-primary-900 font-bold mb-4"
          >
            تشكيلتنا الحصرية
          </motion.h2>
          <p className="text-primary-600 text-lg">تحف فنية من الطبيعة، صُممت بشغف لتليق بك</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-primary-100">
            <h3 className="text-2xl font-serif text-primary-900 mb-2">لا توجد منتجات حالياً</h3>
            <p className="text-primary-500">سيتم إضافة أرقى الباقات قريباً..</p>
          </div>
        ) : (
          <div className="flex flex-col gap-20">
            
            {/* Bento Layout for Top 3 */}
            {featuredProducts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[600px]">
                {/* Product 1 - Large Right */}
                <Link to={`/products/${featuredProducts[0].slug}`} className="md:col-span-8 relative rounded-3xl overflow-hidden group cursor-pointer h-[400px] md:h-full block">
                  <img 
                    src={featuredProducts[0].primary_image ? `http://localhost:8000${featuredProducts[0].primary_image.image_url}` : '/placeholder.jpg'} 
                    alt={featuredProducts[0].name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-between items-end">
                    <div>
                      <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">الأكثر مبيعاً</span>
                      <h3 className="text-3xl font-serif text-white font-bold mb-2">{featuredProducts[0].name}</h3>
                      <p className="text-white/80 line-clamp-1">{featuredProducts[0].description}</p>
                    </div>
                    <div className="bg-white text-primary-900 font-bold px-6 py-3 rounded-full shadow-lg">
                      {featuredProducts[0].price} ر.س
                    </div>
                  </div>
                </Link>

                {/* Left Side Small Products */}
                {featuredProducts.length > 1 && (
                  <div className="md:col-span-4 flex flex-col gap-6 h-[800px] md:h-full">
                    {featuredProducts.slice(1, 3).map((prod, idx) => (
                      <Link to={`/products/${prod.slug}`} key={prod.id} className="flex-1 relative rounded-3xl overflow-hidden group cursor-pointer block h-full min-h-[300px]">
                        <img 
                          src={prod.primary_image ? `http://localhost:8000${prod.primary_image.image_url}` : '/placeholder.jpg'} 
                          alt={prod.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary-950/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-0 left-0 right-0 p-6">
                          <h3 className="text-xl font-serif text-white font-bold mb-1">{prod.name}</h3>
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-white/90 font-bold">{prod.price} ر.س</span>
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-primary-900 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Other Products Grid */}
            {otherProducts.length > 0 && (
              <div>
                <div className="flex justify-between items-end mb-8">
                  <h3 className="text-2xl font-serif text-primary-900 font-bold">المزيد من إبداعاتنا</h3>
                  <Link to="/products" className="text-primary-600 hover:text-primary-900 font-bold flex items-center gap-1 group">
                    عرض الكل
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {otherProducts.map(prod => (
                    <Link to={`/products/${prod.slug}`} key={prod.id} className="group bg-white rounded-3xl overflow-hidden border border-primary-50 shadow-sm hover:shadow-xl transition-all duration-500 block">
                      <div className="aspect-[4/5] relative overflow-hidden bg-primary-50">
                        <img 
                          src={prod.primary_image ? `http://localhost:8000${prod.primary_image.image_url}` : '/placeholder.jpg'} 
                          alt={prod.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-6 relative">
                        <h4 className="text-lg font-bold text-primary-900 mb-2 font-serif group-hover:text-primary-600 transition-colors">{prod.name}</h4>
                        {prod.compare_at_price && Number(prod.compare_at_price) > Number(prod.price) ? (
                          <div className="flex items-center gap-3 mt-4">
                            <span className="text-xl font-bold text-rose-600">{prod.price} ر.س</span>
                            <span className="text-sm text-primary-400 line-through">{prod.compare_at_price} ر.س</span>
                          </div>
                        ) : (
                          <div className="text-xl font-bold text-primary-900 mt-4">{prod.price} ر.س</div>
                        )}
                        
                        <div className="absolute bottom-6 left-6 w-10 h-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center group-hover:bg-primary-900 group-hover:text-white transition-all transform group-hover:scale-110 shadow-sm">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        )}
      </section>
    </div>
  );
}
