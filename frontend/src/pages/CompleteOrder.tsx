import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import { Package, MapPin, CheckCircle2, DollarSign, Loader2 } from 'lucide-react';
import { orderApi } from '../services/api';
import { normalizeSaudiPhone } from '../utils/phone';
import toast from 'react-hot-toast';

const STORE_LOCATION = { lat: 25.3857, lng: 49.5898 };

export default function CompleteOrder() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [draft, setDraft] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');

  // Address
  const [city, setCity] = useState('الأحساء');
  const [street, setStreet] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [deliveryMinutes, setDeliveryMinutes] = useState<number | null>(null);
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [isCalculatingFee, setIsCalculatingFee] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    language: 'ar'
  });

  useEffect(() => {
    if (!token) return;
    orderApi.getDraftOrder(token)
      .then(res => {
        setDraft(res);
        if (res.customer_phone) setCustomerPhone(res.customer_phone);
        if (res.customer_name) setCustomerName(res.customer_name);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'الرابط غير صالح أو منتهي الصلاحية');
      })
      .finally(() => setIsLoading(false));
  }, [token]);

  const getDeliveryFee = (mins: number) => {
    if (draft.delivery_type === 'pickup') return 0;
    if (mins <= 6) return 15;
    if (mins <= 10) return 20;
    if (mins <= 13) return 25;
    if (mins <= 15) return 30;
    if (mins <= 27) return 35;
    if (mins <= 37) return 40;
    return 40;
  };

  const calculateFee = () => {
    if (draft.delivery_type === 'pickup') {
      setDeliveryFee(0);
      setDeliveryMinutes(0);
      return;
    }
    
    if (!street || !city) {
      toast.error('الرجاء كتابة اسم الحي أو الشارع ليتم حساب رسوم التوصيل');
      return;
    }

    if (!isLoaded || !window.google) return;

    setIsCalculatingFee(true);
    const service = new google.maps.DistanceMatrixService();
    const destination = `${street}, ${city}, السعودية`;

    service.getDistanceMatrix({
      origins: [STORE_LOCATION],
      destinations: [destination],
      travelMode: google.maps.TravelMode.DRIVING,
    }, (response, status) => {
      setIsCalculatingFee(false);
      if (status === 'OK' && response && response.rows[0].elements[0].status === 'OK') {
        const mins = Math.ceil(response.rows[0].elements[0].duration.value / 60);
        let fee = getDeliveryFee(mins);
        if (draft.delivery_speed === 'express') fee += 20;
        setDeliveryFee(fee);
        setDeliveryMinutes(mins);
      } else {
        toast.error('لم نتمكن من تحديد الموقع، سيتم تطبيق الرسوم الافتراضية');
        setDeliveryFee(25);
        setDeliveryMinutes(15);
      }
    });
  };

  useEffect(() => {
    if (draft && draft.delivery_type === 'pickup') {
      setDeliveryFee(0);
      setDeliveryMinutes(0);
    }
  }, [draft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = normalizeSaudiPhone(customerPhone);
    const phoneRegex = /^(05)[0-9]{8}$/;
    if (!normalizedPhone || !phoneRegex.test(normalizedPhone)) {
      return toast.error('يرجى إدخال رقم جوال صحيح (مثال: 05XXXXXXXX)');
    }
    if (draft.delivery_type === 'local' && deliveryFee === null) return toast.error('يرجى تحديد العنوان وحساب رسوم التوصيل');

    setIsSubmitting(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_phone: normalizedPhone,
        payment_method: paymentMethod,
        delivery_fee: deliveryFee || 0,
        delivery_minutes: deliveryMinutes,
        address: draft.delivery_type === 'local' ? {
          city,
          street_address: street,
          google_maps_link: googleMapsLink
        } : null
      };

      const res = await orderApi.completeDraftOrder(token!, payload);
      toast.success(res.message);
      navigate(`/orders/${res.order.order_number}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'حدث خطأ أثناء تأكيد الطلب');
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 text-primary-500 animate-spin" /></div>;

  if (error || !draft) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-3xl shadow-sm text-center max-w-md w-full border border-rose-100">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">{error}</h2>
      </div>
    </div>
  );

  const total = parseFloat(draft.subtotal) + (deliveryFee || 0);

  return (
    <div className="bg-primary-50/30 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-primary-950 mb-2">إكمال الطلب المحجوز</h1>
          <p className="text-primary-600">هذا الطلب تم إنشاؤه لك مسبقاً، يرجى إكمال البيانات البسيطة واعتماده.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Info */}
              <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2 border-b border-primary-50 pb-3"><CheckCircle2 className="text-primary-500" /> معلوماتك الشخصية</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-primary-700 mb-1">الاسم الكامل (اختياري)</label>
                    <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-primary-700 mb-1">رقم الجوال</label>
                    <input required type="text" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3" dir="ltr" />
                  </div>
                </div>
              </div>

              {/* Delivery Info */}
              {draft.delivery_type === 'local' && (
                <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm space-y-4">
                  <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2 border-b border-primary-50 pb-3"><MapPin className="text-primary-500" /> عنوان التوصيل</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-primary-700 mb-1">المدينة</label>
                      <input type="text" value={city} onChange={e => { setCity(e.target.value); setDeliveryFee(null); }} className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-primary-700 mb-1">رابط قوقل ماب (اختياري)</label>
                      <input type="url" value={googleMapsLink} onChange={e => setGoogleMapsLink(e.target.value)} placeholder="https://maps.google.com/..." className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3 text-left" dir="ltr" />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-bold text-primary-700 mb-1">اسم الحي / الشارع</label>
                      <input required type="text" value={street} onChange={e => { setStreet(e.target.value); setDeliveryFee(null); }} placeholder="مثال: حي السلام، شارع الملك عبدالله" className="w-full bg-primary-50/50 border border-primary-200 rounded-xl px-4 py-3" />
                    </div>
                  </div>
                  
                  {deliveryFee === null ? (
                    <button type="button" onClick={calculateFee} disabled={isCalculatingFee || !street} className="w-full mt-4 bg-primary-100 text-primary-700 font-bold py-3 rounded-xl disabled:opacity-50">
                      {isCalculatingFee ? 'جاري الحساب...' : 'احسب رسوم التوصيل'}
                    </button>
                  ) : (
                    <div className="mt-4 p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 flex justify-between items-center font-bold">
                      <span>رسوم التوصيل المعتمدة:</span>
                      <span>{deliveryFee} ر.س</span>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Info */}
              <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2 border-b border-primary-50 pb-3"><DollarSign className="text-primary-500" /> طريقة الدفع</h2>
                <div className="space-y-3">
                  <label className={`block border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'bank_transfer' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-100 hover:border-primary-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'bank_transfer'} onChange={() => setPaymentMethod('bank_transfer')} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                      <div>
                        <span className="font-bold text-gray-900 block">تحويل بنكي</span>
                        <span className="text-sm text-gray-500">سيُطلب منك إرفاق إيصال التحويل بعد اعتماد الطلب.</span>
                      </div>
                    </div>
                  </label>
                  <label className={`block border-2 p-4 rounded-xl cursor-pointer transition-all ${paymentMethod === 'cash_on_delivery' ? 'border-primary-500 bg-primary-50/50' : 'border-gray-100 hover:border-primary-200'}`}>
                    <div className="flex items-center gap-3">
                      <input type="radio" name="payment" checked={paymentMethod === 'cash_on_delivery'} onChange={() => setPaymentMethod('cash_on_delivery')} className="w-5 h-5 text-primary-600 focus:ring-primary-500" />
                      <div>
                        <span className="font-bold text-gray-900 block">الدفع عند الاستلام / كاش</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting || (draft.delivery_type === 'local' && deliveryFee === null)} className="w-full bg-primary-600 text-white font-bold py-4 rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-50">
                {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : 'تأكيد واعتماد الطلب'}
              </button>

            </form>
          </div>

          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-primary-100 shadow-sm sticky top-24">
              <h2 className="text-lg font-bold text-primary-900 flex items-center gap-2 border-b border-primary-50 pb-3 mb-4"><Package className="text-primary-500" /> ملخص طلبك</h2>
              
              <div className="space-y-4 mb-6">
                {draft.items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    {item.primary_image ? (
                      <img src={`http://127.0.0.1:8000${item.primary_image}`} alt={item.product_name} className="w-14 h-14 rounded-xl object-cover" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-primary-50 flex items-center justify-center"><Package className="text-primary-300 w-6 h-6"/></div>
                    )}
                    <div>
                      <h4 className="font-bold text-primary-900 text-sm">{item.product_name}</h4>
                      <p className="text-xs text-primary-500">الكمية: {item.quantity}</p>
                      <p className="font-bold text-primary-700 text-sm">{item.total_price} ر.س</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-primary-100 text-sm font-medium">
                <div className="flex justify-between text-primary-600">
                  <span>المجموع الفرعي</span>
                  <span>{draft.subtotal} ر.س</span>
                </div>
                <div className="flex justify-between text-primary-600">
                  <span>التوصيل</span>
                  <span>{deliveryFee !== null ? `${deliveryFee} ر.س` : '-'}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-primary-900 pt-3 border-t border-primary-100">
                  <span>الإجمالي</span>
                  <span>{total.toFixed(2)} ر.س</span>
                </div>
              </div>

              {draft.delivery_date && draft.scheduled_time && (
                <div className="mt-6 bg-primary-50 p-4 rounded-xl text-center">
                  <span className="text-xs text-primary-500 block mb-1">وقت التجهيز / الاستلام المجدول</span>
                  <strong className="text-primary-900 block">{new Date(draft.delivery_date).toLocaleDateString('ar-SA')}</strong>
                  <strong className="text-primary-700">{draft.scheduled_time}</strong>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
