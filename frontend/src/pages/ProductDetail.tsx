import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { publicProductsApi, storeApi } from '../services/api';
import type { Product } from '../types';
import { useCart } from '../store/CartContext';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const { addItem, getAvailableStock } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [queueTimeMinutes, setQueueTimeMinutes] = useState<number>(0);
  
  const [cards, setCards] = useState<Product[]>([]);
  const [gifts, setGifts] = useState<{ id: string, card: Product | null, message: string }>([
    { id: '1', card: null, message: '' }
  ]);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    publicProductsApi.getBySlug(slug)
      .then(data => {
        setProduct(data);
        if (data.primary_image) {
          setActiveImage(`http://127.0.0.1:8000${data.primary_image.image_url}`);
        } else if (data.images && data.images.length > 0) {
          setActiveImage(`http://127.0.0.1:8000${data.images[0].image_url}`);
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/'); // Redirect to home if not found
      })
      .finally(() => setLoading(false));

    storeApi.getQueueStatus()
      .then(data => setQueueTimeMinutes(data.queue_time_minutes || 0))
      .catch(err => console.error(err));
      
    publicProductsApi.getAll('cards')
      .then(data => setCards(data))
      .catch(err => console.error(err));
  }, [slug, navigate]);

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

  if (!product) return null;

  const hasDiscount = product.compare_at_price && Number(product.compare_at_price) > Number(product.price);
  const displayCategory = product.category === 'bouquets' ? 'باقات ورد' : product.category === 'gifts' ? 'هدايا' : 'تنسيقات';

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      {/* Breadcrumbs */}
      <nav className="flex text-sm text-primary-500 mb-8 gap-2">
        <Link to="/" className="hover:text-primary-800">الرئيسية</Link>
        <span>/</span>
        <Link to="/" className="hover:text-primary-800">المنتجات</Link>
        <span className="text-primary-300">/</span>
        <span className="text-primary-900 font-medium">{product.name}</span>
      </nav>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-20">
        {/* Images */}
        <div className="md:w-1/2">
          <div className="aspect-[4/5] bg-primary-50 rounded-3xl overflow-hidden relative border border-primary-100 mb-4">
            <AnimatePresence mode="wait">
              <motion.img 
                key={activeImage || 'placeholder'}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                src={activeImage || undefined}
                alt={product.name}
                className="w-full h-full object-cover"
                style={{ display: activeImage ? 'block' : 'none' }}
              />
            </AnimatePresence>
            {!activeImage && (
              <div className="absolute inset-0 flex items-center justify-center text-primary-300">
                <span className="font-serif text-2xl italic">Lavender</span>
              </div>
            )}
            
            {!product.is_in_stock && (
              <div className="absolute top-4 right-4 bg-rose-500 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                نفدت الكمية
              </div>
            )}
            {hasDiscount && product.is_in_stock && (
              <div className="absolute top-4 right-4 bg-white text-primary-900 text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                عرض خاص
              </div>
            )}
          </div>
          
          {/* Thumbnails */}
          {product.images && product.images.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map(img => {
                const imgUrl = `http://127.0.0.1:8000${img.image_url}`;
                return (
                  <button 
                    key={img.id} 
                    onClick={() => setActiveImage(imgUrl)}
                    className={`w-20 h-24 rounded-xl cursor-pointer border-2 transition-colors flex-shrink-0 overflow-hidden ${activeImage === imgUrl ? 'border-primary-400' : 'border-transparent hover:border-primary-200'}`}
                  >
                    <img src={imgUrl} alt="thumbnail" className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="md:w-1/2 flex flex-col">
          <div className="mb-2 text-sm text-accent-700 font-medium">{displayCategory}</div>
          <h1 className="text-4xl font-serif font-bold text-primary-950 mb-4 leading-tight">{product.name}</h1>
          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-bold text-primary-800">{product.price} ر.س</span>
            {hasDiscount && (
              <span className="text-xl text-primary-400 line-through decoration-primary-300">
                {product.compare_at_price} ر.س
              </span>
            )}
          </div>
          
          <p className="text-primary-700 leading-relaxed mb-4 whitespace-pre-wrap">
            {product.description || 'تنسيق فاخر صُمم بعناية ليليق بمناسباتكم السعيدة.'}
          </p>

          {product.preparation_time_minutes && (
            <div className="flex flex-col gap-1 text-primary-800 bg-primary-50 p-4 rounded-xl mb-8 w-fit">
              <div className="flex items-center gap-3">
                <svg className="text-accent-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>وقت التجهيز الأساسي: <span className="font-bold">{product.preparation_time_minutes} دقيقة</span></span>
              </div>
              {queueTimeMinutes > 0 && (
                <div className="flex items-center gap-3 mt-2 text-amber-600 text-sm bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <span>⚠️ يوجد طابور طلبات حالي قد يضيف <span className="font-bold">{Math.round(queueTimeMinutes)} دقيقة</span> للوقت المتوقع.</span>
                </div>
              )}
            </div>
          )}

          <hr className="border-primary-100 mb-8" />
          
          {/* Gift Message & Card Selection */}
          {product.category !== 'cards' && (
            <div className="mb-8 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-primary-900">رسائل وإهداءات (اختياري)</h3>
                <button 
                  onClick={() => setGifts([...gifts, { id: Date.now().toString(), card: null, message: '' }])}
                  className="text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                  إضافة بطاقة أخرى
                </button>
              </div>

              {gifts.map((gift, index) => (
                <div key={gift.id} className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100 relative">
                  {gifts.length > 1 && (
                    <button 
                      onClick={() => setGifts(gifts.filter(g => g.id !== gift.id))}
                      className="absolute top-4 left-4 text-red-400 hover:text-red-600 p-1 bg-white rounded-full shadow-sm border border-red-100 transition-colors"
                      title="إزالة"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    </button>
                  )}
                  
                  <h4 className="font-bold text-primary-800 mb-3 text-sm flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary-200 text-primary-800 flex items-center justify-center text-xs">{index + 1}</span>
                    نص الرسالة
                  </h4>
                  <textarea 
                    placeholder="اكتب رسالتك هنا..." 
                    value={gift.message}
                    onChange={(e) => {
                      const newGifts = [...gifts];
                      newGifts[index].message = e.target.value;
                      setGifts(newGifts);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none resize-none h-20 mb-4 text-sm"
                  />
                  
                  {cards.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-primary-700 mb-3">اختر شكل البطاقة</h4>
                      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        <button 
                          onClick={() => {
                            const newGifts = [...gifts];
                            newGifts[index].card = null;
                            setGifts(newGifts);
                          }}
                          className={`shrink-0 min-w-[80px] h-[100px] rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors ${!gift.card ? 'border-primary-500 bg-primary-50' : 'border-primary-100 bg-white hover:border-primary-300'}`}
                        >
                          <span className="text-primary-400 text-2xl">🚫</span>
                          <span className="text-xs font-medium text-primary-700">بدون بطاقة</span>
                        </button>
                        
                        {cards.map(card => {
                          const imgUrl = card.primary_image ? `http://127.0.0.1:8000${card.primary_image.image_url}` : null;
                          return (
                            <button 
                              key={card.id}
                              onClick={() => {
                                const newGifts = [...gifts];
                                newGifts[index].card = card;
                                setGifts(newGifts);
                              }}
                              className={`shrink-0 min-w-[80px] h-[100px] rounded-xl border-2 relative overflow-hidden transition-colors ${gift.card?.id === card.id ? 'border-primary-500 shadow-md' : 'border-transparent hover:border-primary-300'}`}
                            >
                              {imgUrl ? (
                                <img src={imgUrl} alt={card.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-primary-100 flex items-center justify-center text-primary-400 text-xs text-center p-1">{card.name}</div>
                              )}
                              <div className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-1 truncate px-1">
                                {Number(card.price) > 0 ? `${card.price} ر.س` : 'مجاني'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <hr className="border-primary-100 mb-8" />

          {/* Add to Cart Actions */}
          <div className="flex gap-4 mb-8">
            <div className="flex items-center bg-primary-50 rounded-xl border border-primary-200 overflow-hidden">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!product.is_in_stock}
                className="w-12 h-14 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
              >
                -
              </button>
              <span className="w-12 text-center font-semibold text-primary-900">{quantity}</span>
              <button 
                onClick={() => setQuantity(Math.min(getAvailableStock(product), quantity + 1))}
                disabled={!product.is_in_stock || quantity >= getAvailableStock(product)}
                className="w-12 h-14 flex items-center justify-center text-primary-700 hover:bg-primary-100 transition-colors disabled:opacity-50"
              >
                +
              </button>
            </div>
            
            <motion.button 
              whileTap={{ scale: product.is_in_stock ? 0.98 : 1 }}
              disabled={!product.is_in_stock || isAdding || getAvailableStock(product) === 0}
              onClick={() => {
                setIsAdding(true);
                let mainProductMessage = gifts
                  .filter(g => !g.card && g.message.trim() !== '')
                  .map((g, i) => gifts.length > 1 ? `الرسالة ${i+1}:\n${g.message}` : g.message)
                  .join('\n\n---\n\n');

                addItem(product, quantity, mainProductMessage);

                gifts.forEach((gift) => {
                  if (gift.card) {
                    addItem(gift.card, 1, gift.message);
                  }
                });
                setTimeout(() => {
                  navigate('/cart');
                }, 400);
              }}
              className={`flex-1 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-colors shadow-lg ${product.is_in_stock && getAvailableStock(product) > 0 ? 'bg-primary-800 text-white hover:bg-primary-900 shadow-primary-900/10' : 'bg-gray-200 text-gray-500 shadow-none cursor-not-allowed'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
              {isAdding ? 'تمت الإضافة ✔️' : product.is_in_stock && getAvailableStock(product) > 0 ? 'إضافة للسلة' : 'تجاوزت الكمية المتوفرة'}
            </motion.button>
          </div>



        </div>
      </div>
    </div>
  );
}
