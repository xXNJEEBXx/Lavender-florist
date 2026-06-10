import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  slug: string;
  price: string;
  category: string;
  primary_image?: {
    image_url: string;
  };
}

import { publicProductsApi } from '../services/api';

export default function Products() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Categories
  const categories = [
    { id: 'all', name: 'الكل' },
    { id: 'bouquets', name: 'باقات ورد' },
    { id: 'boxes', name: 'بوكسات' },
    { id: 'table_arrangements', name: 'فازات وتنسيقات' },
    { id: 'gift_sets', name: 'تغليف وهدايا' },
  ];

  useEffect(() => {
    publicProductsApi.getAll()
      .then(data => {
        setProducts(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="py-12 px-4 lg:px-8 max-w-7xl mx-auto min-h-[80vh]">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-serif font-bold text-primary-900 mb-4">تسوق التنسيقات</h1>
        <p className="text-primary-600">اكتشف مجموعتنا المختارة بعناية لتناسب كل مناسباتك</p>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap justify-center gap-2 mb-12">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-primary-800 text-white shadow-md'
                : 'bg-white text-primary-700 border border-primary-200 hover:bg-primary-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="animate-pulse bg-white rounded-2xl p-4 border border-primary-100">
              <div className="bg-primary-100 aspect-[4/5] rounded-xl mb-4"></div>
              <div className="h-4 bg-primary-100 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-primary-100 rounded w-1/4 mb-6"></div>
              <div className="flex justify-between items-center">
                <div className="h-6 bg-primary-100 rounded w-1/3"></div>
                <div className="h-10 w-10 bg-primary-100 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              key={product.id}
              className="group bg-white rounded-2xl overflow-hidden border border-primary-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              <Link to={`/products/${product.slug}`} className="block relative aspect-[4/5] bg-primary-50 overflow-hidden">
                {product.primary_image ? (
                  <img src={`http://127.0.0.1:8000${product.primary_image.image_url}`} alt={product.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-primary-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m8 14 4-4 4 4"/></svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-primary-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <div className="p-5 flex flex-col flex-grow">
                <div className="text-xs text-primary-500 mb-1">{categories.find(c => c.id === product.category)?.name}</div>
                <Link to={`/products/${product.slug}`}>
                  <h3 className="text-lg font-semibold text-primary-900 mb-2 hover:text-primary-600 transition-colors">{product.name}</h3>
                </Link>
                
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="text-xl font-bold text-accent-700">{product.price} ر.س</span>
                  <button 
                    onClick={() => console.log('Add to cart', product.id)}
                    className="h-10 w-10 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center hover:bg-primary-800 hover:text-white transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-20 text-center text-primary-500">
              لا توجد منتجات في هذا التصنيف حالياً.
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
