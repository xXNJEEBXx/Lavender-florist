import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, FileText, CheckCircle2, Clock, Package, Truck, X, MapPin, Download } from 'lucide-react';
import { adminOrdersApi } from '../../services/api';

export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    loadOrders();
  }, [statusFilter, page]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const data = await adminOrdersApi.getAll(statusFilter, page);
      setOrders(data.data);
      setTotalPages(data.last_page);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openOrderDetails = async (id: number) => {
    try {
      const order = await adminOrdersApi.getById(id);
      setSelectedOrder(order);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load order details', error);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      setIsVerifying(true);
      const res = await adminOrdersApi.verifyPayment(selectedOrder.id);
      setSelectedOrder(res.order);
      // Update the order in the list as well
      setOrders(orders.map(o => o.id === selectedOrder.id ? res.order : o));
      showToast('تم تأكيد الدفع بنجاح!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تأكيد الدفع', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      const res = await adminOrdersApi.updateStatus(selectedOrder.id, newStatus);
      setSelectedOrder(res.order);
      setOrders(orders.map(o => o.id === selectedOrder.id ? res.order : o));
      showToast('تم تحديث الحالة بنجاح!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث الحالة', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string, color: string }> = {
      pending: { label: 'جديد', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      preparing: { label: 'قيد التجهيز', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      ready: { label: 'جاهز للاستلام', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      delivering: { label: 'جاري التوصيل', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      delivered: { label: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200' },
    };
    const b = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-3 py-1 rounded-full text-xs font-bold border ${b.color}`}>{b.label}</span>;
  };

  const filters = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'جديد' },
    { id: 'preparing', label: 'قيد التجهيز' },
    { id: 'ready', label: 'جاهز' },
    { id: 'delivering', label: 'جاري التوصيل' },
    { id: 'delivered', label: 'مكتمل' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">الطلبات</h1>
          <p className="text-primary-600 mt-1">إدارة طلبات المتجر ومراجعة الحوالات البنكية.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-primary-100 mb-6 inline-flex overflow-x-auto max-w-full">
        {filters.map(filter => (
          <button
            key={filter.id}
            onClick={() => { setStatusFilter(filter.id); setPage(1); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              statusFilter === filter.id 
                ? 'bg-primary-800 text-white shadow-md' 
                : 'text-primary-600 hover:bg-primary-50'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 border-b border-primary-100">
                <th className="px-6 py-4 text-primary-900 font-bold">رقم الطلب</th>
                <th className="px-6 py-4 text-primary-900 font-bold">العميل</th>
                <th className="px-6 py-4 text-primary-900 font-bold">التاريخ</th>
                <th className="px-6 py-4 text-primary-900 font-bold">المبلغ</th>
                <th className="px-6 py-4 text-primary-900 font-bold">الحالة</th>
                <th className="px-6 py-4 text-primary-900 font-bold">الدفع</th>
                <th className="px-6 py-4 text-primary-900 font-bold text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-primary-500 font-bold">جاري التحميل...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-primary-500 font-bold">لا توجد طلبات تطابق الفلتر الحالي.</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-primary-900">{order.order_number}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-primary-900">{order.customer?.name}</div>
                      <div className="text-sm text-primary-500">{order.customer?.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-primary-700">{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                    <td className="px-6 py-4 font-bold text-primary-900">{order.total} ر.س</td>
                    <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                    <td className="px-6 py-4">
                      {order.payment_status === 'paid' ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-bold"><CheckCircle2 className="w-4 h-4"/> مدفوع</span>
                      ) : order.bank_transfer_receipt ? (
                        <span className="flex items-center gap-1 text-amber-600 text-sm font-bold"><Clock className="w-4 h-4"/> بانتظار التأكيد</span>
                      ) : (
                        <span className="text-gray-500 text-sm">غير مدفوع</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => openOrderDetails(order.id)}
                        className="p-2 bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 transition-colors inline-flex items-center gap-2 text-sm font-bold"
                      >
                        <Eye className="w-4 h-4" /> عرض
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-primary-100 flex justify-between items-center bg-gray-50/50">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-4 py-2 border border-primary-200 rounded-lg text-primary-700 disabled:opacity-50 font-medium"
            >
              السابق
            </button>
            <span className="text-primary-600">صفحة {page} من {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="px-4 py-2 border border-primary-200 rounded-lg text-primary-700 disabled:opacity-50 font-medium"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-primary-100 flex justify-between items-center bg-primary-50/30">
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-bold text-primary-900">طلب #{selectedOrder.order_number}</h2>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-primary-400 hover:text-primary-700 bg-white rounded-full hover:bg-primary-50 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column (Customer & Summary) */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
                      <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><UserIcon /> بيانات العميل</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-primary-500 block mb-1">الاسم</span>
                          <strong className="text-primary-900">{selectedOrder.customer?.name}</strong>
                        </div>
                        <div>
                          <span className="text-primary-500 block mb-1">رقم الجوال</span>
                          <strong className="text-primary-900" dir="ltr">{selectedOrder.customer?.phone}</strong>
                        </div>
                        <div>
                          <span className="text-primary-500 block mb-1">طريقة الاستلام</span>
                          <strong className="text-primary-900">{selectedOrder.delivery_type === 'pickup' ? 'استلام من الفرع' : 'توصيل'}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Address Info */}
                    {selectedOrder.delivery_type === 'local' && selectedOrder.address && (
                      <div className="bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
                        <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" /> عنوان التوصيل</h3>
                        <p className="text-sm text-primary-800 font-medium leading-relaxed">
                          {selectedOrder.address.street_address}<br/>
                          {selectedOrder.address.district}، {selectedOrder.address.city}
                        </p>
                        {selectedOrder.address.latitude && (
                          <a 
                            href={`https://maps.google.com/?q=${selectedOrder.address.latitude},${selectedOrder.address.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="mt-4 block text-center bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors"
                          >
                            فتح في خرائط جوجل
                          </a>
                        )}
                      </div>
                    )}

                    {/* Order Notes */}
                    {selectedOrder.notes && (
                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                        <h3 className="font-bold text-amber-900 mb-2">ملاحظات الطلب</h3>
                        <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column (Items & Payment) */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Bank Transfer Receipt Review */}
                    {selectedOrder.payment_method === 'bank_transfer' && (
                      <div className={`p-6 rounded-2xl border-2 shadow-sm ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-amber-200'}`}>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h3 className="text-lg font-bold text-primary-900 mb-1 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-primary-500" /> 
                              إيصال التحويل البنكي
                            </h3>
                            {selectedOrder.payment_status === 'paid' ? (
                              <p className="text-emerald-700 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> تم تأكيد الدفع</p>
                            ) : selectedOrder.bank_transfer_receipt ? (
                              <p className="text-amber-600 text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> بانتظار التحقق من قبلك</p>
                            ) : (
                              <p className="text-rose-500 text-sm font-medium">العميل لم يقم برفع الإيصال بعد</p>
                            )}
                          </div>
                          
                          {selectedOrder.payment_status !== 'paid' && selectedOrder.bank_transfer_receipt && (
                            <button 
                              onClick={handleVerifyPayment}
                              disabled={isVerifying}
                              className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2"
                            >
                              {isVerifying ? 'جاري التأكيد...' : 'تأكيد الحوالة والبدء بالتجهيز'}
                            </button>
                          )}
                        </div>

                        {selectedOrder.bank_transfer_receipt && (
                          <div className="bg-gray-100 rounded-xl overflow-hidden border border-gray-200 aspect-video relative group">
                            {selectedOrder.bank_transfer_receipt.endsWith('.pdf') ? (
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white">
                                <FileText className="w-16 h-16 text-red-500 mb-4" />
                                <span className="font-bold text-gray-700 mb-4">ملف PDF</span>
                                <a href={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} target="_blank" rel="noreferrer" className="bg-primary-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-900">
                                  <Download className="w-4 h-4" /> تحميل وعرض الملف
                                </a>
                              </div>
                            ) : (
                              <a href={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} target="_blank" rel="noreferrer">
                                <img 
                                  src={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} 
                                  alt="إيصال التحويل" 
                                  className="w-full h-full object-contain bg-black/5"
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg">اضغط للتكبير</span>
                                </div>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Order Items */}
                    <div className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm">
                      <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-primary-500" /> المنتجات المطلوبة</h3>
                      <div className="space-y-4 mb-6">
                        {selectedOrder.items?.map((item: any) => (
                          <div key={item.id} className="flex gap-4 p-4 bg-primary-50/30 rounded-xl border border-primary-50">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shrink-0 border border-primary-100">
                              {item.product?.primary_image && (
                                <img src={`http://localhost:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-primary-900">{item.product_name}</h4>
                              <p className="text-sm text-primary-500">الكمية: {item.quantity} × {item.unit_price} ر.س</p>
                              {item.gift_message && (
                                <p className="text-xs text-primary-700 bg-white p-2 mt-2 rounded border border-primary-100 font-medium">رسالة الكرت: "{item.gift_message}"</p>
                              )}
                            </div>
                            <div className="font-bold text-primary-900">{item.total_price} ر.س</div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-2 pt-4 border-t border-primary-100 text-sm font-medium">
                        <div className="flex justify-between text-primary-600"><span>المجموع الفرعي</span><span>{selectedOrder.subtotal} ر.س</span></div>
                        <div className="flex justify-between text-primary-600"><span>رسوم التوصيل</span><span>{selectedOrder.delivery_fee} ر.س</span></div>
                        <div className="flex justify-between text-xl font-bold text-primary-950 pt-4 border-t border-primary-100 mt-2">
                          <span>الإجمالي</span>
                          <span>{selectedOrder.total} ر.س</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
              
              {/* Actions Footer */}
              <div className="p-6 border-t border-primary-100 bg-white flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary-700">تغيير حالة الطلب:</span>
                  <div className="flex bg-primary-50 p-1 rounded-xl">
                    <button 
                      onClick={() => handleStatusChange('preparing')} disabled={isUpdatingStatus || selectedOrder.status === 'preparing'}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'preparing' ? 'bg-white shadow text-primary-900' : 'text-primary-600 hover:text-primary-900'}`}
                    >
                      تجهيز
                    </button>
                    <button 
                      onClick={() => handleStatusChange('ready')} disabled={isUpdatingStatus || selectedOrder.status === 'ready'}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'ready' ? 'bg-white shadow text-primary-900' : 'text-primary-600 hover:text-primary-900'}`}
                    >
                      جاهز
                    </button>
                    <button 
                      onClick={() => handleStatusChange('delivering')} disabled={isUpdatingStatus || selectedOrder.status === 'delivering' || selectedOrder.delivery_type === 'pickup'}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'delivering' ? 'bg-white shadow text-primary-900' : 'text-primary-600 hover:text-primary-900 disabled:opacity-30'}`}
                    >
                      توصيل
                    </button>
                    <button 
                      onClick={() => handleStatusChange('delivered')} disabled={isUpdatingStatus || selectedOrder.status === 'delivered'}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === 'delivered' ? 'bg-white shadow text-primary-900' : 'text-primary-600 hover:text-primary-900'}`}
                    >
                      مكتمل
                    </button>
                  </div>
                </div>
                
                <button onClick={() => handleStatusChange('cancelled')} disabled={isUpdatingStatus || selectedOrder.status === 'cancelled'} className="text-sm font-bold text-rose-500 hover:text-rose-700 px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors">
                  إلغاء الطلب
                </button>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] font-bold text-white border-2 ${
              toastMessage.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-rose-600 border-rose-400'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

// User Icon component since it wasn't imported from lucide
function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
