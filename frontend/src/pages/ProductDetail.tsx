import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddon, setSelectedAddon] = useState<string | null>(null);

  // Placeholder data
  const product = {
    id: 1,
    name: 'باقة الحب الأبدي',
    price: '150.00',
    description: 'باقة رائعة من الورد الجوري الأحمر تغلف باللون الأسود الفاخر لتعبر عن أصدق المشاعر. التنسيق يشمل 12 وردة جوري مع أوراق خضراء متناسقة.',
    category: 'باقات ورد',
    features: ['ورد طبيعي 100%', 'تغليف فاخر', 'كرت إهداء مجاني'],
    preparation_time: '30 دقيقة',
  };

  useEffect(() => {
    // Simulate fetch
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse flex flex-col md:flex-row gap-12">
        <div className="md:w-1/2 aspect-[4/5] bg-primary-100 rounded-3xl"></div>
        <div className="md:w-1/2 py-8">
          <div className="h-10 bg-primary-100 rounded w-3/4 mb-4"></div>
          <div className="h-8 bg-primary-100 rounded w-1/4 mb-8"></div>
          <div className="space-y-4 mb-8">
            <div className="h-4 bg-primary-100 rounded w-full"></div>
            <div className="h-4 bg-primary-100 rounded w-5/6"></div>
            <div className="h-4 bg-primary-100 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-primary-500 mb-8 gap-2">
        <Link to="/" className="hover:text-primary-800">الرئيسية</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-primary-800">المنتجات</Link>
        <span>/</span>
        <span className="text-primary-900 font-medium">{product.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Images */}
        <div className="md:w-1/2">
          <div className="aspect-[4/5] bg-primary-50 rounded-3xl overflow-hidden relative border border-primary-100">
            <div className="absolute inset-0 flex items-center justify-center text-primary-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m8 14 4-4 4 4"/></svg>
            </div>
          </div>
          {/* Thumbnails placeholder */}
          <div className="flex gap-4 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-20 h-24 bg-primary-50 rounded-xl cursor-pointer border-2 border-transparent hover:border-primary-300 transition-colors"></div>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 flex flex-col">
          <div className="mb-2 text-sm text-accent-700 font-medium">{product.category}</div>
          <h1 className="text-4xl font-serif font-bold text-primary-950 mb-4 leading-tight">{product.name}</h1>
          <div className="text-3xl font-bold text-primary-800 mb-8">{product.price} ر.س</div>
          
          <p className="text-primary-700 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Add-ons Placeholder */}
          <div className="mb-8">
            <h3 className="font-semibold text-primary-900 mb-4">إضافات مقترحة</h3>
            <div className="flex gap-4">
              {['شوكولاتة بستاني (+80 ر.س)', 'بالون هيليوم (+25 ر.س)'].map((addon, i) => (
                <button 
                  key={i}
                  onClick={() => setSelectedAddon(addon === selectedAddon ? null : addon)}
                  className={`px-4 py-3 rounded-xl text-sm border transition-all ${
                    selectedAddon === addon 
                      ? 'border-accent-500 bg-accent-50 text-accent-800' 
                      : 'border-primary-200 bg-white text-primary-700 hover:border-primary-400'
                  }`}
                >
                  {addon}
                </button>
              ))}
            </div>
          </div>

          <hr className="border-primary-100 mb-8" />

          {/* Add to Cart Actions */}
          <div className="flex gap-4 mb-8">
            <div className="flex items-center bg-primary-50 rounded-xl border border-primary-200 overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-12 h-14 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold text-primary-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-12 h-14 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors"
              >
                +
              </button>
            </div>
            
            <motion.button 
              whileTap={{ scale: 0.98 }}
              className="flex-1 bg-primary-800 text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              إضافة للسلة
            </motion.button>
          </div>

          {/* Product Features */}
          <div className="bg-primary-50 rounded-2xl p-6 mt-auto">
            <ul className="space-y-3">
              {product.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-primary-800">
                  <svg className="text-accent-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  {feature}
                </li>
              ))}
              <li className="flex items-center gap-3 text-primary-800">
                <svg className="text-accent-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                مدة التحضير: {product.preparation_time}
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
