import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { publicProductsApi } from '../services/api';
import { CheckCircle2, ChevronRight, MapPin, CreditCard, ShoppingBag, Truck } from 'lucide-react';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [deliveryMinutes, setDeliveryMinutes] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const getDeliveryFee = (mins: number) => {
    if (mins <= 6) return 15;
    if (mins <= 10) return 20;
    if (mins <= 13) return 25;
    if (mins <= 15) return 30;
    if (mins <= 27) return 35;
    if (mins <= 37) return 40;
    return 0;
  };

  const deliveryFee = deliveryMinutes !== null && !isRejecting ? getDeliveryFee(deliveryMinutes) : 0;
  const total = subtotal + deliveryFee;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'الرياض', // Default for now
    address: '',
    notes: '',
    payment_method: 'cash_on_delivery',
    delivery_type: 'local'
  });

  const handleCalculateDelivery = () => {
    setIsCalculating(true);
    setIsRejecting(false);
    // محاكاة الاتصال بـ Google Maps API
    setTimeout(() => {
      // توليد رقم عشوائي بين 3 و 45 لتجربة النظام
      const minutes = Math.floor(Math.random() * 42) + 3;
      setDeliveryMinutes(minutes);
      
      if (minutes > 37) {
        setIsRejecting(true);
      }
      setIsCalculating(false);
    }, 1500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (deliveryMinutes === null || isRejecting) {
      setError('الرجاء حساب رسوم التوصيل أولاً والتأكد من إمكانية التوصيل لموقعك.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const payload = {
        ...formData,
        delivery_fee: deliveryFee,
        items: items.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          gift_message: item.gift_message
        }))
      };
      
      const response = await publicProductsApi.checkout(payload);
      
      setOrderNumber(response.order.order_number);
      setIsSuccess(true);
      clearCart();
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء معالجة الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring" }}
          className="bg-white p-10 rounded-3xl border border-primary-100 shadow-xl shadow-primary-900/5"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-bold font-serif text-primary-950 mb-4">تم استلام طلبك بنجاح!</h1>
          <p className="text-primary-600 mb-8 max-w-md mx-auto leading-relaxed">
            شكراً لتسوقك من لافندر فلوريست. سنقوم بتجهيز باقتك بكل حب واهتمام.
            <br />
            رقم الطلب الخاص بك هو: <strong className="text-primary-900 font-mono bg-primary-50 px-2 py-1 rounded">{orderNumber}</strong>
          </p>
          <Link 
            to="/" 
            className="inline-block px-8 py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10"
          >
            العودة للصفحة الرئيسية
          </Link>
        </motion.div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-primary-900 mb-4">سلة المشتريات فارغة</h2>
        <button onClick={() => navigate('/products')} className="text-primary-600 underline">تصفح المنتجات</button>
      </div>
    );
  }

  return (
    <div className="bg-primary-50/30 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/cart" className="p-2 hover:bg-white rounded-xl transition-colors text-primary-600">
            <ChevronRight className="w-6 h-6" />
          </Link>
          <h1 className="text-3xl font-serif font-bold text-primary-950">إتمام الطلب</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Details */}
          <div className="flex-1 space-y-6 w-full">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-4 rounded-2xl border border-rose-100 text-sm font-medium">
                {error}
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <UserIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">المعلومات الشخصية</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">الاسم الكامل *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="الاسم" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">رقم الجوال *</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="05XXXXXXXX" dir="ltr" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-900 mb-2">البريد الإلكتروني (اختياري)</label>
                  <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="example@email.com" dir="ltr" />
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">عنوان التوصيل</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">المدينة *</label>
                  <select required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none bg-white">
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="مكة">مكة المكرمة</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-900 mb-2">الحي والشارع *</label>
                  <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none" placeholder="اسم الحي، الشارع، رقم المبنى" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-primary-900 mb-2">ملاحظات للمندوب (اختياري)</label>
                  <textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} rows={2} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none resize-none" placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة" />
                </div>
              </div>

              {/* Delivery Calculation */}
              <div className="mt-6 p-5 bg-primary-50 rounded-2xl border border-primary-100">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div>
                    <h3 className="font-bold text-primary-900 mb-1">تحديد رسوم التوصيل</h3>
                    <p className="text-sm text-primary-600">نستخدم خرائط جوجل لحساب وقت وتكلفة التوصيل بدقة.</p>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleCalculateDelivery}
                    disabled={isCalculating}
                    className="whitespace-nowrap px-6 py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 transition-colors disabled:opacity-70"
                  >
                    {isCalculating ? 'جاري الحساب...' : 'حساب التوصيل'}
                  </button>
                </div>
                
                {deliveryMinutes !== null && (
                  <div className="mt-4 pt-4 border-t border-primary-200">
                    {isRejecting ? (
                      <div className="text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
                        <p className="font-bold mb-1">نعتذر منك!</p>
                        <p className="text-sm">المسافة لموقعك تستغرق ({deliveryMinutes} دقيقة) وهو خارج نطاق التوصيل المسموح به (أقصى حد 37 دقيقة).</p>
                      </div>
                    ) : (
                      <div className="text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                        <div>
                          <p className="font-bold">يمكننا التوصيل لموقعك!</p>
                          <p className="text-sm mt-1 text-emerald-600">الوقت المقدر: {deliveryMinutes} دقيقة</p>
                          <p className="text-xs mt-2 text-primary-500 italic">* ملاحظة: السعر والوقت قد يختلف قليلاً مع الزحمة المرورية.</p>
                        </div>
                        <div className="text-2xl font-bold">{deliveryFee} ر.س</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">طريقة الدفع</h2>
              </div>
              
              <div className="space-y-3">
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.payment_method === 'cash_on_delivery' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}>
                  <input type="radio" name="payment" value="cash_on_delivery" checked={formData.payment_method === 'cash_on_delivery'} onChange={e => setFormData({...formData, payment_method: e.target.value})} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-900">الدفع عند الاستلام</h3>
                    <p className="text-sm text-primary-500 mt-1">ادفع نقداً أو بالشبكة عند وصول المندوب</p>
                  </div>
                  <Truck className="w-6 h-6 text-primary-400" />
                </label>
                
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${formData.payment_method === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}>
                  <input type="radio" name="payment" value="bank_transfer" checked={formData.payment_method === 'bank_transfer'} onChange={e => setFormData({...formData, payment_method: e.target.value})} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-900">تحويل بنكي</h3>
                    <p className="text-sm text-primary-500 mt-1">سيتم تزويدك بحساباتنا بعد إتمام الطلب</p>
                  </div>
                  <CreditCard className="w-6 h-6 text-primary-400" />
                </label>
              </div>
            </div>

          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:w-[400px] w-full">
            <div className="bg-white rounded-3xl border border-primary-100 shadow-sm p-6 sticky top-28">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-primary-900">ملخص الطلب</h2>
              </div>
              
              <div className="max-h-60 overflow-y-auto mb-6 pr-2 space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary-50 rounded-lg overflow-hidden flex-shrink-0">
                        {item.product.primary_image ? (
                          <img src={`http://localhost:8000${item.product.primary_image.image_url}`} alt={item.product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-300"><ShoppingBag className="w-4 h-4"/></div>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-primary-900 text-sm line-clamp-1">{item.product.name}</h4>
                        <p className="text-xs text-primary-500 mt-1">الكمية: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-medium text-sm text-primary-900 whitespace-nowrap">{item.product.price * item.quantity} ر.س</span>
                  </div>
                ))}
              </div>
              
              <hr className="border-primary-100 mb-6" />
              
              <div className="space-y-4 text-sm text-primary-700 mb-6">
                <div className="flex justify-between">
                  <span>المجموع الفرعي</span>
                  <span className="font-medium">{subtotal} ر.س</span>
                </div>
                <div className="flex justify-between">
                  <span>رسوم التوصيل</span>
                  <span className="font-medium">{deliveryFee} ر.س</span>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-8 bg-primary-50 p-4 rounded-2xl border border-primary-100">
                <span className="font-bold text-primary-900">الإجمالي النهائي</span>
                <span className="font-bold text-accent-700 text-2xl">{deliveryMinutes === null ? '---' : total} ر.س</span>
              </div>
              
              <button 
                type="submit"
                disabled={isLoading || deliveryMinutes === null || isRejecting}
                className="w-full bg-primary-800 text-white rounded-xl py-4 font-bold text-lg hover:bg-primary-900 active:bg-primary-950 transition-all shadow-lg shadow-primary-900/10 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="animate-pulse">جاري تأكيد الطلب...</span>
                ) : (
                  <>
                    تأكيد الطلب 
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                )}
              </button>
              
              {deliveryMinutes === null && (
                <p className="text-center text-sm text-rose-500 mt-4 font-medium">الرجاء حساب رسوم التوصيل أولاً</p>
              )}
              
              <p className="text-center text-xs text-primary-400 mt-4">بضغطك على "تأكيد الطلب" أنت توافق على شروط وأحكام المتجر.</p>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
}

// Simple icon for user info
function UserIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
  );
}
