import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../store/CartContext';
import { publicProductsApi, customerApi } from '../services/api';
import { CheckCircle2, ChevronRight, MapPin, CreditCard, ShoppingBag, Truck, Plus, X, Map as MapIcon } from 'lucide-react';
import { useJsApiLoader, GoogleMap, Marker } from '@react-google-maps/api';

const STORE_LOCATION = { lat: 25.4535688, lng: 49.5847893 }; // Actual Store Location
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    language: 'ar'
  });

  // Address State
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  
  // Map State
  const [mapCenter, setMapCenter] = useState(STORE_LOCATION);
  const [selectedLocation, setSelectedLocation] = useState<google.maps.LatLngLiteral | null>(null);

  // Delivery State
  const [deliveryMinutes, setDeliveryMinutes] = useState<number | null>(null);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  // Order State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');

  // New Address Form State
  const [addressError, setAddressError] = useState('');
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: 'المنزل',
    recipient_name: '',
    recipient_phone: '',
    city: 'الأحساء',
    street_address: '',
    is_default: true,
  });

  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadAddresses();
    }
  }, [isAuthenticated]);

  const loadAddresses = async () => {
    try {
      const data = await customerApi.getAddresses();
      setAddresses(data);
      if (data.length > 0) {
        const defaultAddress = data.find((a: any) => a.is_default) || data[0];
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (err) {
      console.error("Failed to load addresses", err);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    // Phone Validation (Saudi format: 05XXXXXXXX)
    const phoneRegex = /^(05)[0-9]{8}$/;
    if (!phoneRegex.test(newAddress.recipient_phone)) {
      setAddressError('رقم الجوال غير صحيح. يجب أن يبدأ بـ 05 ويتكون من 10 أرقام.');
      return;
    }
    
    if (!newAddress.street_address || newAddress.street_address.trim() === '') {
      setAddressError('الرجاء تحديد الموقع من الخريطة أو كتابة تفاصيل العنوان.');
      return;
    }

    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        const data = await customerApi.updateAddress(editingAddressId, newAddress);
        setAddresses(addresses.map(a => a.id === editingAddressId ? data : a));
        setSelectedAddressId(data.id);
      } else {
        const data = await customerApi.addAddress(newAddress);
        setAddresses([...addresses, data]);
        setSelectedAddressId(data.id);
      }
      setIsAddressModalOpen(false);
      setEditingAddressId(null);
      setNewAddress({
        name: 'المنزل',
        recipient_name: '',
        recipient_phone: '',
        city: 'الأحساء',
        street_address: '',
        is_default: true,
      });
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401) {
        setAddressError('انتهت جلسة تسجيل الدخول، يرجى تسجيل الدخول مجدداً.');
      } else {
        setAddressError('حدث خطأ أثناء حفظ العنوان. يرجى المحاولة لاحقاً.');
      }
    } finally {
      setIsSavingAddress(false);
    }
  };

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

  const handleCalculateDelivery = () => {
    if (!selectedAddressId) {
      alert("الرجاء تحديد العنوان أولاً");
      return;
    }
    
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    setIsCalculating(true);
    setIsRejecting(false);
    
    if (isLoaded && window.google) {
      const service = new google.maps.DistanceMatrixService();
      
      let destination: string | google.maps.LatLngLiteral = selectedAddress.street_address;
      
      // If the address was saved as coordinates
      if (typeof destination === 'string' && destination.startsWith('إحداثيات:')) {
        const coords = destination.replace('إحداثيات:', '').split(',');
        if (coords.length === 2) {
          destination = { lat: parseFloat(coords[0].trim()), lng: parseFloat(coords[1].trim()) };
        }
      } else if (typeof destination === 'string' && !destination.includes('السعودية') && !destination.includes('Saudi Arabia')) {
        destination = `${destination}, الأحساء, السعودية`;
      }

      service.getDistanceMatrix({
        origins: [STORE_LOCATION],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      }, (response, status) => {
        setIsCalculating(false);
        if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
          const durationSeconds = response.rows[0].elements[0].duration.value;
          const minutes = Math.ceil(durationSeconds / 60);
          setDeliveryMinutes(minutes);
          if (minutes > 37) {
            setIsRejecting(true);
          }
        } else {
          // Fallback if API fails to find it exactly, use mock to not block the user entirely
          const fallbackMins = 15;
          setDeliveryMinutes(fallbackMins);
        }
      });
    } else {
      setIsCalculating(false);
      setDeliveryMinutes(15); // Fallback
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    if (!selectedAddressId) {
      setError('الرجاء اختيار عنوان التوصيل');
      return;
    }
    if (deliveryMinutes === null || isRejecting) {
      setError('الرجاء حساب رسوم التوصيل أولاً والتأكد من إمكانية التوصيل لموقعك.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const payload = {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
        delivery_type: 'local',
        delivery_fee: deliveryFee,
        notes: notes,
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
          <Link to="/" className="inline-block px-8 py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10">
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

            {/* Address Selection */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold text-primary-900">التوصيل إلى</h2>
                </div>
                <button type="button" onClick={() => setIsAddressModalOpen(true)} className="text-sm font-semibold text-primary-700 bg-primary-50 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors flex items-center gap-2">
                  <Plus className="w-4 h-4" /> عنوان جديد
                </button>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-primary-200 rounded-2xl">
                  <p className="text-primary-500 mb-4">ليس لديك عناوين محفوظة</p>
                  <button type="button" onClick={() => setIsAddressModalOpen(true)} className="px-6 py-2 bg-primary-800 text-white rounded-xl hover:bg-primary-900 transition-colors">
                    إضافة عنوان
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div 
                      key={address.id} 
                      onClick={() => {
                        setSelectedAddressId(address.id);
                        setDeliveryMinutes(null);
                      }}
                      className={`cursor-pointer p-4 rounded-2xl border-2 transition-all ${selectedAddressId === address.id ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-primary-900">{address.name}</span>
                        <div className="flex gap-2">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingAddressId(address.id);
                              setNewAddress({
                                name: address.name,
                                recipient_name: address.recipient_name,
                                recipient_phone: address.recipient_phone,
                                city: address.city,
                                street_address: address.street_address,
                                is_default: address.is_default
                              });
                              setIsAddressModalOpen(true);
                            }}
                            className="text-xs font-bold text-primary-600 hover:text-primary-800 transition-colors"
                          >
                            تعديل
                          </button>
                          {selectedAddressId === address.id && <CheckCircle2 className="w-5 h-5 text-primary-600" />}
                        </div>
                      </div>
                      <p className="text-sm text-primary-700 font-medium mb-1">{address.recipient_name} - {address.recipient_phone}</p>
                      <p className="text-sm text-primary-500">{address.city} - {address.street_address}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <label className="block text-sm font-bold text-primary-900 mb-2">ملاحظات إضافية للتوصيل (اختياري)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-2 focus:ring-primary-500 transition-all outline-none resize-none" placeholder="مثال: يرجى الاتصال قبل الوصول بنصف ساعة" />
            </div>

            {/* Delivery Calculation */}
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-primary-900 mb-1">رسوم التوصيل</h3>
                  <p className="text-sm text-primary-600">نستخدم خرائط جوجل لحساب وقت وتكلفة التوصيل بدقة بناءً على عنوانك.</p>
                </div>
                <button 
                  type="button" 
                  onClick={handleCalculateDelivery}
                  disabled={isCalculating || !selectedAddressId}
                  className="whitespace-nowrap px-6 py-3 bg-primary-800 text-white rounded-xl font-medium hover:bg-primary-900 transition-colors disabled:opacity-70 shadow-lg shadow-primary-900/10"
                >
                  {isCalculating ? 'جاري الحساب...' : 'حساب التوصيل'}
                </button>
              </div>
              
              {deliveryMinutes !== null && (
                <div className="mt-6 pt-4 border-t border-primary-100">
                  {isRejecting ? (
                    <div className="text-rose-600 bg-rose-50 p-4 rounded-xl border border-rose-100">
                      <p className="font-bold mb-1">نعتذر منك!</p>
                      <p className="text-sm">المسافة لعنوانك تستغرق ({deliveryMinutes} دقيقة) وهو خارج نطاق التوصيل المسموح به (أقصى حد 37 دقيقة).</p>
                    </div>
                  ) : (
                    <div className="text-emerald-700 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex justify-between items-center">
                      <div>
                        <p className="font-bold">يمكننا التوصيل لعنوانك!</p>
                        <p className="text-sm mt-1 text-emerald-600">الوقت المقدر من المتجر: {deliveryMinutes} دقيقة</p>
                        <p className="text-xs mt-2 text-primary-500 italic">* ملاحظة: السعر والوقت قد يختلف قليلاً مع الزحمة المرورية.</p>
                      </div>
                      <div className="text-2xl font-bold">{deliveryFee} ر.س</div>
                    </div>
                  )}
                </div>
              )}
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
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}>
                  <input type="radio" name="payment" value="cash_on_delivery" checked={paymentMethod === 'cash_on_delivery'} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
                  <div className="flex-1">
                    <h3 className="font-bold text-primary-900">الدفع عند الاستلام</h3>
                    <p className="text-sm text-primary-500 mt-1">ادفع نقداً أو بالشبكة عند وصول المندوب</p>
                  </div>
                  <Truck className="w-6 h-6 text-primary-400" />
                </label>
                
                <label className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-primary-500 bg-primary-50' : 'border-primary-100 hover:border-primary-300'}`}>
                  <input type="radio" name="payment" value="bank_transfer" checked={paymentMethod === 'bank_transfer'} onChange={e => setPaymentMethod(e.target.value)} className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300" />
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

      {/* Add Address Modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm" onClick={() => setIsAddressModalOpen(false)} />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50 shrink-0">
                <h3 className="text-xl font-bold text-primary-900">{editingAddressId ? 'تعديل العنوان' : 'إضافة عنوان جديد'}</h3>
                <button onClick={() => setIsAddressModalOpen(false)} className="p-2 hover:bg-white rounded-full text-primary-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSaveAddress} className="p-6 overflow-y-auto">
                {addressError && (
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm mb-4 border border-rose-100">
                    {addressError}
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Google Maps Placeholder Button */}
                  <div className="mb-6">
                    <button 
                      type="button" 
                      onClick={() => setIsMapModalOpen(true)}
                      className="w-full flex items-center justify-center gap-3 bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100 p-4 rounded-xl font-bold transition-colors"
                    >
                      <MapIcon className="w-5 h-5" />
                      تحديد الموقع عبر خرائط جوجل
                    </button>
                    {newAddress.street_address.includes('تم تحديد') && (
                      <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4"/> تم تحديد الموقع بنجاح
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم للعنوان (مثال: المنزل، العمل)</label>
                      <input required value={newAddress.name} onChange={e => setNewAddress({...newAddress, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم المستلم</label>
                      <input required value={newAddress.recipient_name} onChange={e => setNewAddress({...newAddress, recipient_name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">رقم جوال المستلم</label>
                      <input required type="tel" value={newAddress.recipient_phone} onChange={e => setNewAddress({...newAddress, recipient_phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary-900 mb-2">المدينة</label>
                      <select required disabled value={newAddress.city} className="w-full px-4 py-3 rounded-xl border border-primary-200 bg-primary-50 outline-none text-primary-600">
                        <option value="الأحساء">الأحساء (متاح حالياً فقط)</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-primary-900 mb-2">اسم الحي والشارع</label>
                      <input required value={newAddress.street_address} onChange={e => setNewAddress({...newAddress, street_address: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-primary-200 focus:ring-primary-500 outline-none" placeholder="الرجاء استخدام زر الخريطة أو كتابة العنوان" />
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 flex gap-3">
                  <button type="submit" disabled={isSavingAddress} className="flex-1 py-4 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-colors shadow-lg shadow-primary-900/10 disabled:opacity-70">
                    {isSavingAddress ? 'جاري الحفظ...' : 'حفظ العنوان'}
                  </button>
                  {editingAddressId && (
                    <button 
                      type="button" 
                      disabled={isSavingAddress} 
                      onClick={async () => {
                        if (confirm('هل أنت متأكد من حذف هذا العنوان؟')) {
                          setIsSavingAddress(true);
                          try {
                            await customerApi.deleteAddress(editingAddressId);
                            setAddresses(addresses.filter(a => a.id !== editingAddressId));
                            if (selectedAddressId === editingAddressId) setSelectedAddressId(null);
                            setIsAddressModalOpen(false);
                          } catch (e) {
                            alert('فشل الحذف');
                          } finally {
                            setIsSavingAddress(false);
                          }
                        }
                      }}
                      className="px-6 py-4 bg-rose-50 text-rose-600 rounded-xl font-bold hover:bg-rose-100 transition-colors disabled:opacity-70"
                    >
                      حذف
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Google Maps Real Modal */}
      <AnimatePresence>
        {isMapModalOpen && isLoaded && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMapModalOpen(false)} />
            <motion.div 
              initial={{ y: 50, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }} 
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative z-10 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-bold flex items-center gap-2"><MapIcon className="w-5 h-5 text-emerald-600"/> تحديد الموقع</h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                          (position) => {
                            const pos = {
                              lat: position.coords.latitude,
                              lng: position.coords.longitude,
                            };
                            setMapCenter(pos);
                            setSelectedLocation(pos);
                          },
                          () => {
                            alert("لم نتمكن من تحديد موقعك. تأكد من إعطاء الصلاحية للمتصفح.");
                          },
                          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                        );
                      } else {
                        alert("المتصفح الخاص بك لا يدعم تحديد الموقع.");
                      }
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <MapPin className="w-4 h-4" /> موقعي الحالي
                  </button>
                  <button onClick={() => setIsMapModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="h-[400px] w-full relative">
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={mapCenter}
                  zoom={15}
                  options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: false,
                  }}
                  onClick={(e) => {
                    if (e.latLng) {
                      setSelectedLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
                    }
                  }}
                >
                  {selectedLocation && (
                    <Marker position={selectedLocation} />
                  )}
                </GoogleMap>
              </div>
              
              <div className="p-6 bg-white flex justify-end gap-3 border-t border-gray-100">
                <button 
                  onClick={() => setIsMapModalOpen(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  disabled={!selectedLocation}
                  onClick={() => {
                    if (selectedLocation) {
                      // Reverse Geocode
                      const geocoder = new google.maps.Geocoder();
                      geocoder.geocode({ location: selectedLocation }, (results, status) => {
                        if (status === 'OK' && results && results[0]) {
                          setNewAddress({...newAddress, street_address: results[0].formatted_address});
                        } else {
                          setNewAddress({...newAddress, street_address: `إحداثيات: ${selectedLocation.lat.toFixed(4)}, ${selectedLocation.lng.toFixed(4)}`});
                        }
                        setIsMapModalOpen(false);
                      });
                    }
                  }}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg disabled:opacity-50"
                >
                  تأكيد الموقع
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
