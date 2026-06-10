import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, FileText, Upload, Clock, Package, Truck, MapPin, Edit3 } from 'lucide-react';
import { orderApi } from '../services/api';
import { useCart } from '../store/CartContext';
import toast from 'react-hot-toast';

function DeliveryTimeDisplay({ order }: { order: any }) {
  if (order.status === 'delivered' || order.status === 'cancelled') return null;
  if (order.delivery_type === 'pickup') return null;

  let targetTime: Date | null = null;
  
  if (order.scheduled_at) {
    targetTime = new Date(order.scheduled_at);
  } else if (order.delivery_minutes) {
    // Local delivery ASAP
    const baseTime = order.confirmed_at ? new Date(order.confirmed_at) : new Date(order.created_at);
    targetTime = new Date(baseTime.getTime() + order.delivery_minutes * 60000);
  } else if (order.estimated_delivery_at) {
     targetTime = new Date(order.estimated_delivery_at);
  }

  if (!targetTime) return null;

  const dateStr = targetTime.toLocaleDateString('ar-SA', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const timeStr = targetTime.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className="bg-gradient-to-br from-primary-900 to-primary-800 text-white p-6 rounded-3xl shadow-xl shadow-primary-900/10 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative border border-primary-700">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-primary-600/30 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex items-center gap-5 w-full sm:w-auto">
        <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
          <Clock className="w-7 h-7 text-primary-200" />
        </div>
        <div>
          <h2 className="text-primary-200 text-sm mb-1">
            {order.scheduled_at ? 'موعد التسليم المجدول' : 'الوقت المتوقع للتسليم'}
          </h2>
          <p className="text-xl font-bold" dir="ltr">
            {timeStr}
          </p>
        </div>
      </div>

      <div className="relative z-10 bg-white/10 backdrop-blur-sm px-5 py-3 rounded-xl border border-white/10 shadow-sm w-full sm:w-auto text-center">
        <span className="text-sm font-medium text-white">{dateStr}</span>
      </div>
    </div>
  );
}

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [paymentJustification, setPaymentJustification] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const navigate = useNavigate();
  const { restoreCartItems } = useCart() as any;

  useEffect(() => {
    if (orderNumber) {
      loadOrder(true);
      // Auto-refresh every 10 seconds
      const id = setInterval(() => loadOrder(false), 10000);
      return () => clearInterval(id);
    }
  }, [orderNumber]);

  const loadOrder = async (showLoading = false) => {
    try {
      // Don't show loading on subsequent fetches to avoid flicker
      if (showLoading) setIsLoading(true);
      const data = await orderApi.getOrderByNumber(orderNumber!);
      setOrder(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'لم يتم العثور على الطلب.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('تم النسخ!');
  };

  const handleEditOrder = async () => {
    if (!window.confirm('سيتم إلغاء هذا الطلب وإعادة المنتجات إلى السلة لتتمكن من تعديل التوصيل أو محتويات الطلب. هل أنت متأكد؟')) return;
    
    setIsCancelling(true);
    try {
      await orderApi.cancelOrder(order.order_number);
      const cartItems = order.items.map((i: any) => ({
        product: {
          ...i.product,
          price: i.unit_price,
          id: i.product_id
        },
        quantity: i.quantity,
        gift_message: i.gift_message
      }));
      restoreCartItems(cartItems);
      toast.success('تم نقل منتجاتك للسلة بنجاح.');
      navigate('/checkout');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'فشل في إلغاء الطلب');
      setIsCancelling(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!receiptFile && !paymentJustification) || !orderNumber) return;
    
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    
    try {
      const response = await orderApi.uploadReceipt(orderNumber, receiptFile, paymentJustification);
      setOrder(response.order);
      setUploadSuccess(response.message);
      setReceiptFile(null);
      setPaymentJustification('');
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'حدث خطأ أثناء إرسال البيانات.');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center bg-primary-50/30">
        <div className="animate-pulse text-primary-500 font-bold text-xl">جاري تحميل تفاصيل الطلب...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen py-20 flex items-center justify-center bg-primary-50/30">
        <div className="bg-white p-10 rounded-3xl text-center max-w-md w-full">
          <div className="text-rose-500 text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-primary-900 mb-4">{error}</h2>
          <Link to="/" className="text-primary-600 underline">العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  const needsTransfer = order.payment_method === 'bank_transfer' && !order.bank_transfer_receipt && !order.payment_justification;
  const underReview = order.payment_method === 'bank_transfer' && (order.bank_transfer_receipt || order.payment_justification) && order.status === 'pending';
  
  const statusOrder = ['pending', 'preparing', 'ready', 'delivering', 'delivered'];
  const currentStepIndex = statusOrder.indexOf(order.status);

  return (
    <div className="bg-primary-50/30 min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-serif font-bold text-primary-950 mb-2">حالة الطلب #{order.order_number}</h1>
          <p className="text-primary-600">تابع حالة طلبك وأكمل إجراءات الدفع إن لزم الأمر.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Status Column */}
          <div className="space-y-6">

            <DeliveryTimeDisplay order={order} />

            {/* Edit Order Alert/Button */}
            {order.status === 'pending' && (!order.bank_transfer_receipt && !order.payment_justification || order.payment_method === 'cash_on_delivery') && (
              <div className="bg-sky-50 border border-sky-100 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-sky-900">هل ترغب بتعديل التوصيل أو المنتجات؟</h3>
                  <p className="text-sm text-sky-700">يمكنك إلغاء الطلب والعودة للسلة في هذه المرحلة.</p>
                </div>
                <button 
                  onClick={handleEditOrder}
                  disabled={isCancelling}
                  className="bg-white text-sky-700 border border-sky-200 hover:bg-sky-100 font-bold py-2 px-4 rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50"
                >
                  <Edit3 className="w-4 h-4" />
                  {isCancelling ? 'جاري الإلغاء...' : 'تعديل الطلب'}
                </button>
              </div>
            )}
            
            {/* Needs Transfer Alert */}
            {needsTransfer && (
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-8 rounded-3xl border-2 border-amber-400 shadow-lg shadow-amber-900/5">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-amber-900">بانتظار التحويل البنكي</h2>
                    <p className="text-sm text-amber-700">يرجى تحويل مبلغ الطلب لكي نبدأ بالتجهيز.</p>
                  </div>
                </div>

                <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mb-6 space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-amber-200/50">
                    <span className="text-amber-700">المبلغ المطلوب</span>
                    <span className="text-2xl font-bold text-amber-900">{order.total} ر.س</span>
                  </div>
                  <div>
                    <span className="text-xs text-amber-600 block mb-1">اسم البنك</span>
                    <strong className="text-amber-900">مصرف الراجحي</strong>
                  </div>
                  <div>
                    <span className="text-xs text-amber-600 block mb-1">اسم الحساب</span>
                    <strong className="text-amber-900">لافندر فلوريست للزهور</strong>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="text-xs text-amber-600 block mb-1">رقم الآيبان (IBAN)</span>
                      <strong className="text-amber-900 font-mono" dir="ltr">SA00 0000 0000 0000 0000 0000</strong>
                    </div>
                    <button onClick={() => handleCopy('SA0000000000000000000000')} className="text-amber-600 hover:text-amber-800 p-2 bg-amber-100 rounded-lg transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  {uploadError && <p className="text-rose-500 text-sm font-medium">{uploadError}</p>}
                  
                  <label className="block w-full border-2 border-dashed border-amber-300 bg-white hover:bg-amber-50 transition-colors p-6 rounded-2xl text-center cursor-pointer">
                    <input 
                      type="file" 
                      accept=".jpg,.jpeg,.png,.pdf" 
                      className="hidden" 
                      onChange={e => setReceiptFile(e.target.files ? e.target.files[0] : null)}
                    />
                    <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    {receiptFile ? (
                      <span className="font-bold text-amber-900">{receiptFile.name}</span>
                    ) : (
                      <>
                        <span className="block font-bold text-amber-700">اضغط لرفع الإيصال</span>
                        <span className="text-xs text-amber-500 mt-1 block">صورة أو PDF (الحد الأقصى 5MB)</span>
                      </>
                    )}
                  </label>

                  <div className="relative flex items-center py-2">
                    <div className="flex-grow border-t border-amber-200"></div>
                    <span className="shrink-0 px-4 text-amber-500 text-sm font-bold">أو</span>
                    <div className="flex-grow border-t border-amber-200"></div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-amber-900 mb-2">اكتب مبرر التحويل (إن تعذر رفع الإيصال)</label>
                    <textarea 
                      value={paymentJustification}
                      onChange={e => setPaymentJustification(e.target.value)}
                      placeholder="مثال: حولت من حساب باسم فلان الفلاني..."
                      className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                      rows={3}
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={(!receiptFile && !paymentJustification) || isUploading}
                    className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isUploading ? 'جاري الإرسال...' : 'تأكيد الحوالة'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Under Review Alert */}
            {underReview && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl border-2 border-emerald-400 shadow-xl shadow-emerald-900/5 text-center">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                  <CheckCircle2 className="w-12 h-12 relative z-10" />
                  <div className="absolute inset-0 border-4 border-emerald-200 rounded-full animate-ping opacity-20"></div>
                </div>
                <h2 className="text-2xl font-bold text-emerald-900 mb-2">تم تسجيل طلبك بنجاح!</h2>
                <p className="text-emerald-700 font-medium mb-1">التحويل البنكي قيد المراجعة حالياً.</p>
                <p className="text-emerald-600 text-sm">شكراً لك! سيتم تأكيد طلبك والبدء بتجهيزه فور مطابقة الحوالة.</p>
                {uploadSuccess && <p className="mt-6 text-emerald-700 font-bold bg-emerald-50 py-3 px-4 rounded-xl border border-emerald-100">{uploadSuccess}</p>}
              </motion.div>
            )}

            {/* Detailed Timeline */}
            <div className="bg-white p-8 rounded-3xl border-2 border-primary-100 shadow-xl shadow-primary-900/5 mt-6">
                <h2 className="text-xl font-bold text-primary-900 mb-6">مسار الطلب</h2>
                
                <div className="relative pl-4 space-y-8">
                  {/* Line */}
                  <div className="absolute top-2 bottom-2 right-[27px] w-0.5 bg-primary-100"></div>

                  {/* Step 1: Preparing */}
                  <div className={`relative flex items-start gap-4 ${currentStepIndex >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${currentStepIndex >= 1 ? 'bg-emerald-500 text-white' : 'bg-primary-100 text-primary-400'}`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">قيد التجهيز</h3>
                      <p className="text-sm text-primary-600">نقوم بتنسيق طلبك بكل عناية.</p>
                    </div>
                  </div>

                  {/* Step 2: Ready */}
                  <div className={`relative flex items-start gap-4 ${currentStepIndex >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${currentStepIndex >= 2 ? 'bg-emerald-500 text-white' : 'bg-primary-100 text-primary-400'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">تم التجهيز</h3>
                      <p className="text-sm text-primary-600">الطلب جاهز للاستلام.</p>
                    </div>
                  </div>

                  {/* Step 3: Delivering (if applicable) */}
                  {order.delivery_type !== 'pickup' && (
                    <div className={`relative flex items-start gap-4 ${currentStepIndex >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${currentStepIndex >= 3 ? 'bg-emerald-500 text-white' : 'bg-primary-100 text-primary-400'}`}>
                        <Truck className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-primary-900">جاري التوصيل</h3>
                        <p className="text-sm text-primary-600">
                          المندوب استلم الطلب وهو في طريقه إليك!
                          {order.driver && <span className="block mt-1 font-medium text-emerald-600">المندوب: {order.driver.name}</span>}
                        </p>
                        {order.delivering_at && <p className="text-xs text-primary-400 mt-1">{new Date(order.delivering_at).toLocaleTimeString('ar-SA')}</p>}
                      </div>
                    </div>
                  )}

                  {/* Step 4: Delivered */}
                  <div className={`relative flex items-start gap-4 ${currentStepIndex >= 4 ? 'opacity-100' : 'opacity-40'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0 ${currentStepIndex >= 4 ? 'bg-emerald-500 text-white' : 'bg-primary-100 text-primary-400'}`}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-900">تم التسليم</h3>
                      <p className="text-sm text-primary-600">نتمنى أن تكون تجربتك رائعة معنا.</p>
                      {order.delivered_at && <p className="text-xs text-primary-400 mt-1">{new Date(order.delivered_at).toLocaleTimeString('ar-SA')}</p>}
                    </div>
                  </div>

                </div>
              </div>
          </div>

          {/* Details Column */}
          <div className="bg-white p-8 rounded-3xl border border-primary-100 shadow-sm space-y-8 h-fit">
            
            <div>
              <h3 className="text-lg font-bold text-primary-900 mb-4 border-b border-primary-100 pb-2">تفاصيل الطلب</h3>
              <div className="space-y-4">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="w-16 h-16 bg-primary-50 rounded-xl overflow-hidden shrink-0">
                      {item.product?.primary_image ? (
                        <img src={`http://127.0.0.1:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-primary-900">{item.product_name}</h4>
                      <p className="text-sm text-primary-500 mb-1">الكمية: {item.quantity}</p>
                      <p className="font-bold text-primary-700">{item.total_price} ر.س</p>
                      {item.gift_message && (
                        <div className="mt-2 bg-primary-50/50 p-3 rounded-lg border border-primary-100 text-sm">
                          <div className="flex items-center gap-1.5 text-primary-700 font-bold mb-1">
                            <FileText className="w-4 h-4" /> رسالة الإهداء:
                          </div>
                          <p className="text-primary-800 whitespace-pre-wrap">{item.gift_message.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-primary-100">
              <div className="flex justify-between text-primary-600">
                <span>المجموع الفرعي</span>
                <span>{order.subtotal} ر.س</span>
              </div>
              <div className="flex justify-between text-primary-600">
                <span>التوصيل</span>
                <span>{order.delivery_fee} ر.س</span>
              </div>
              <div className="flex justify-between text-xl font-bold text-primary-900 pt-3 border-t border-primary-100">
                <span>الإجمالي</span>
                <span>{order.total} ر.س</span>
              </div>
            </div>

            <div className="pt-6 border-t border-primary-100 grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="block text-primary-500 mb-1">تاريخ الطلب</span>
                <span className="font-bold text-primary-900">{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
              <div>
                <span className="block text-primary-500 mb-1">طريقة الاستلام</span>
                <span className="font-bold text-primary-900">{order.delivery_type === 'pickup' ? 'استلام من الفرع' : 'توصيل'}</span>
              </div>
              <div>
                <span className="block text-primary-500 mb-1">الموعد</span>
                <span className="font-bold text-primary-900">
                  {order.scheduled_at ? (
                    <span dir="ltr">{new Date(order.scheduled_at).toLocaleString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                  ) : order.delivery_date ? (
                    <span dir="ltr">{new Date(order.delivery_date).toLocaleDateString('en-CA')}</span>
                  ) : (
                    'أسرع وقت'
                  )}
                </span>
              </div>
            </div>

            {/* Extra Details */}
            <div className="pt-6 border-t border-primary-100 space-y-4 text-sm">
              {(order.owner_name || order.customer?.name) && (
                <div>
                  <h4 className="font-bold text-primary-900 mb-2">صاحب الطلب</h4>
                  <div className="bg-primary-50 p-4 rounded-xl text-primary-900">
                    <p className="font-bold">{order.owner_name || order.customer?.name}</p>
                    {(order.owner_phone || order.customer?.phone) && (
                      <p className="text-primary-700" dir="ltr">{order.owner_phone || order.customer?.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {order.address && (
                <div>
                  <h4 className="font-bold text-primary-900 mb-2">عنوان التوصيل</h4>
                  <div className="bg-primary-50 p-4 rounded-xl text-primary-700">
                    <p><span className="font-semibold text-primary-900">المستلم:</span> {order.address.recipient_name} <span dir="ltr">({order.address.recipient_phone})</span></p>
                    <div className="flex items-start justify-between">
                      <p><span className="font-semibold text-primary-900">العنوان:</span> {order.address.city}، {order.address.street}</p>
                      <a 
                        href={order.address.latitude && order.address.longitude ? `https://maps.google.com/?q=${order.address.latitude},${order.address.longitude}` : `https://maps.google.com/?q=${encodeURIComponent(order.address.city + ' ' + order.address.street)}`}
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-1 text-xs bg-primary-100 hover:bg-primary-200 text-primary-700 px-3 py-1.5 rounded-lg transition-colors font-bold shrink-0"
                      >
                        <MapPin className="w-3.5 h-3.5" /> الخريطة
                      </a>
                    </div>
                    {order.address.delivery_notes && (
                      <p className="mt-2"><span className="font-semibold text-primary-900">ملاحظات التوصيل:</span> {order.address.delivery_notes}</p>
                    )}
                  </div>
                </div>
              )}

              {order.notes && (
                <div>
                  <h4 className="font-bold text-primary-900 mb-2">ملاحظات الطلب</h4>
                  <div className="bg-primary-50 p-4 rounded-xl text-primary-700 whitespace-pre-wrap">
                    {order.notes}
                  </div>
                </div>
              )}

              {order.payment_method === 'bank_transfer' && (order.bank_transfer_receipt || order.payment_justification) && (
                <div>
                  <h4 className="font-bold text-primary-900 mb-2">معلومات التحويل البنكي</h4>
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-emerald-800 space-y-2">
                    {order.bank_transfer_receipt && (
                      <a href={`http://127.0.0.1:8000${order.bank_transfer_receipt}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-emerald-700 hover:text-emerald-900 font-bold underline">
                        <FileText className="w-4 h-4" /> عرض إيصال التحويل المرفق
                      </a>
                    )}
                    {order.payment_justification && (
                      <p><span className="font-semibold">مبرر التحويل:</span> {order.payment_justification}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
