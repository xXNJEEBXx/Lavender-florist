import { motion } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { useAuth } from '../store/AuthContext';
import { Trash2, Loader2 } from 'lucide-react';

export default function Cart() {
  const { items, updateQuantity, removeItem, subtotal, getAvailableStock, isSharedSession, exitSharedSession, isLoading } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const deliveryFee = 15.00;
  const total = subtotal + deliveryFee;

  const handleCheckoutClick = () => {
    // If it's a shared session, no need to require login strictly unless you want to.
    // The Complete Draft Order endpoint doesn't require auth token.
    navigate('/checkout');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-12">
      <h1 className="text-3xl font-serif font-bold text-primary-950 mb-8">سلة المشتريات</h1>
      
      {isSharedSession && (
        <div className="mb-8 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex justify-between items-center animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
            <div>
              <p className="font-bold text-emerald-800">أنت تتسوق في جلسة مشتركة</p>
              <p className="text-sm text-emerald-600">هذا الطلب مرتبط مباشرة مع إدارة المتجر.</p>
            </div>
          </div>
          <button onClick={exitSharedSession} className="text-emerald-700 bg-emerald-100/50 hover:bg-emerald-200 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
            إنهاء الجلسة المشتركة
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mb-4" />
          <p className="text-primary-800 font-medium">جاري تحميل بيانات السلة...</p>
        </div>
      ) : items.length > 0 ? (
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Cart Items List */}
          <div className="flex-1 space-y-6">
            {items.map((item) => (
              <motion.div 
                layout
                key={item.cartItemId} 
                className="flex flex-col bg-white p-4 rounded-2xl border border-primary-100 shadow-sm"
              >
                <div className="flex gap-6">
                  {/* Image */}
                  {item.product.primary_image ? (
                    <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${item.product.primary_image.image_url}`} alt={item.product.name} className="w-24 h-24 bg-primary-50 rounded-xl object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-24 h-24 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary-100">
                      <svg className="text-primary-300" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m8 14 4-4 4 4"/></svg>
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-primary-900 text-lg">{item.product.name}</h3>
                        {item.options?.message && (
                          <p className="text-sm text-primary-500 mt-1 whitespace-pre-wrap">رسالة الإهداء: {item.options.message}</p>
                        )}
                      </div>
                      <button onClick={() => removeItem(item.cartItemId)} className="text-primary-400 hover:text-red-500 transition-colors p-2">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex justify-between items-center mt-4">
                      <div className="text-lg font-bold text-accent-700">{item.product.price} ر.س</div>
                      
                      <div className="flex items-center bg-primary-50 rounded-lg border border-primary-100 overflow-hidden">
                        <button onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors">-</button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)} 
                          disabled={getAvailableStock(item.product) === 0}
                          className="w-8 h-8 flex items-center justify-center text-primary-600 hover:bg-primary-100 transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Addons Display */}
                {item.addons && item.addons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-primary-50 flex flex-col gap-3">
                    <span className="text-xs font-bold text-primary-400 uppercase tracking-wider">الإضافات الملحقة</span>
                    {item.addons.map((addon, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-primary-50/50 p-3 rounded-xl border border-primary-100/50">
                        <div className="flex items-center gap-3">
                          {addon.product.primary_image_url ? (
                            <img src={`${import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'}${addon.product.primary_image_url}`} alt={addon.product.name} className="w-12 h-12 rounded object-cover" />
                          ) : (
                            <div className="w-12 h-12 bg-primary-100 rounded flex items-center justify-center text-xs text-primary-400">ملحق</div>
                          )}
                          <div>
                            <p className="font-semibold text-primary-800 text-sm">{addon.product.name}</p>
                            {addon.options?.message && <p className="text-xs text-primary-500 mt-0.5 line-clamp-1">{addon.options.message}</p>}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-accent-600">
                          {Number(addon.product.price) > 0 ? `+${addon.product.price} ر.س` : 'مجاني'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:w-96">
            <div className="bg-white rounded-2xl border border-primary-100 shadow-sm p-6 sticky top-28">
              <h2 className="text-xl font-bold text-primary-900 mb-6">ملخص الطلب</h2>
              
              <div className="space-y-4 text-primary-700 mb-6">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{subtotal} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل</span>
                  <span className="font-medium">{deliveryFee} ر.س</span>
                </div>
              </div>
              
              <hr className="border-primary-100 mb-6" />
              
              <div className="flex justify-between items-center mb-8">
                <span className="font-bold text-primary-900 text-lg">المجموع الإجمالي</span>
                <span className="font-bold text-accent-700 text-2xl">{total} ر.س</span>
              </div>
              
              <p className="text-xs text-primary-500 mb-6">السعر يشمل ضريبة القيمة المضافة 15%</p>
              
              <button onClick={handleCheckoutClick} className="w-full bg-primary-800 text-white rounded-xl py-4 font-semibold text-lg hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10">
                إتمام الطلب والدفع
              </button>
              
              <Link to="/" className="block text-center mt-4 text-sm text-primary-600 hover:text-primary-800 underline decoration-primary-200 underline-offset-4 transition-colors">
                متابعة التسوق
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-primary-100">
          <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-300">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
          </div>
          <h2 className="text-2xl font-bold text-primary-900 mb-4">سلة المشتريات فارغة</h2>
          <p className="text-primary-500 mb-8 max-w-md mx-auto">يبدو أنك لم تضف أي منتجات بعد. تصفح مجموعتنا الجميلة واصنع باقتك الخاصة.</p>
          <Link to="/" className="inline-block px-8 py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 transition-colors">
            تصفح المنتجات
          </Link>
        </div>
      )}
    </div>
  );
}
