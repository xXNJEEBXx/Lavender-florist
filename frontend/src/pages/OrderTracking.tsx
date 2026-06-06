import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Copy, FileText, Upload, Clock, Package, Truck } from 'lucide-react';
import { orderApi } from '../services/api';

export default function OrderTracking() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState('');

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
    alert('تم النسخ!');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptFile || !orderNumber) return;
    
    setIsUploading(true);
    setUploadError('');
    setUploadSuccess('');
    
    try {
      const response = await orderApi.uploadReceipt(orderNumber, receiptFile);
      setOrder(response.order);
      setUploadSuccess(response.message);
      setReceiptFile(null);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || 'حدث خطأ أثناء رفع الإيصال.');
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

  const needsTransfer = order.payment_method === 'bank_transfer' && !order.bank_transfer_receipt;
  const underReview = order.payment_method === 'bank_transfer' && order.bank_transfer_receipt && order.status === 'pending';
  
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

                  <button 
                    type="submit" 
                    disabled={!receiptFile || isUploading}
                    className="w-full bg-amber-500 text-white font-bold py-4 rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    {isUploading ? 'جاري الرفع...' : 'تأكيد الحوالة'}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Under Review Alert */}
            {underReview && (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-8 rounded-3xl border-2 border-primary-200 shadow-xl shadow-primary-900/5 text-center">
                <div className="w-20 h-20 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-10 h-10 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-primary-900 mb-2">جاري مراجعة الحوالة وتأكيد الطلب...</h2>
                <p className="text-primary-600">شكراً لك! استلمنا إيصال الدفع وسنقوم بمراجعته والبدء بتجهيز طلبك في أقرب وقت.</p>
                {uploadSuccess && <p className="mt-4 text-emerald-600 font-bold bg-emerald-50 py-2 rounded-lg">{uploadSuccess}</p>}
              </motion.div>
            )}

            {/* Detailed Timeline */}
            {!needsTransfer && !underReview && (
              <div className="bg-white p-8 rounded-3xl border-2 border-primary-100 shadow-xl shadow-primary-900/5">
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
            )}

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
                        <img src={`http://localhost:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                    <div>
                      <h4 className="font-bold text-primary-900">{item.product_name}</h4>
                      <p className="text-sm text-primary-500">الكمية: {item.quantity}</p>
                      <p className="font-bold text-primary-700">{item.total_price} ر.س</p>
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

            <div className="pt-6 border-t border-primary-100 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-primary-500 mb-1">تاريخ الطلب</span>
                <span className="font-bold text-primary-900">{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
              </div>
              <div>
                <span className="block text-primary-500 mb-1">طريقة الاستلام</span>
                <span className="font-bold text-primary-900">{order.delivery_type === 'pickup' ? 'استلام من الفرع' : 'توصيل'}</span>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
