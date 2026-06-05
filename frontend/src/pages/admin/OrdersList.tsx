import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, FileText, CheckCircle2, Clock, Package, Truck, X, MapPin, Download, AlertTriangle, Timer, ChevronDown, ChevronUp } from 'lucide-react';
import { adminOrdersApi } from '../../services/api';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

// ── Time Helpers ───────────────────────────────────────────────
function getElapsedMinutes(dateStr: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000));
}

function formatElapsed(mins: number): string {
  if (mins < 60) return `${mins} د`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h} س ${m} د` : `${h} س`;
}

function getUrgency(status: string, createdAt: string): 'ok' | 'warn' | 'danger' {
  if (['delivered', 'cancelled'].includes(status)) return 'ok';
  const elapsed = getElapsedMinutes(createdAt);
  if (elapsed >= 45) return 'danger';
  if (elapsed >= 20) return 'warn';
  return 'ok';
}

// Re-render every 30s
function useTick(ms = 30000) {
  const [, set] = useState(0);
  useEffect(() => { const id = setInterval(() => set(t => t + 1), ms); return () => clearInterval(id); }, [ms]);
}

// Next status map
const nextStatus: Record<string, { status: string; label: string }> = {
  pending:    { status: 'preparing',  label: 'بدء التجهيز' },
  preparing:  { status: 'ready',      label: 'تم التجهيز' },
  ready:      { status: 'delivering', label: 'جاري التوصيل' },
  delivering: { status: 'delivered',  label: 'تم التوصيل' },
};

// ── Main Component ──────────────────────────────────────────────
export default function OrdersList() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('incomplete');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [incompleteCount, setIncompleteCount] = useState(0);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [updatingRowId, setUpdatingRowId] = useState<number | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState<number | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
    language: 'ar'
  });

  const [toastMessage, setToastMessage] = useState<{message: string, type: 'success'|'error'} | null>(null);

  useTick(30000);

  const showToast = (message: string, type: 'success'|'error') => {
    setToastMessage({ message, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => { loadOrders(); }, [statusFilter, page]);

  useEffect(() => {
    const id = setInterval(() => { if (!isModalOpen) loadOrders(); }, 60000);
    return () => clearInterval(id);
  }, [statusFilter, page, isModalOpen]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      // For "incomplete", we send a custom param; for "all", send no filter
      const filterParam = statusFilter === 'incomplete' ? 'incomplete' : 'all';
      const data = await adminOrdersApi.getAll(filterParam, page);
      setOrders(data.data);
      setTotalPages(data.last_page);
      setTotalCount(data.total);
      // Load incomplete count separately if viewing all
      if (statusFilter === 'all') {
        try {
          const inc = await adminOrdersApi.getAll('incomplete', 1);
          setIncompleteCount(inc.total);
        } catch {}
      } else {
        setIncompleteCount(data.total);
        // Also load all count
        try {
          const all = await adminOrdersApi.getAll('all', 1);
          setTotalCount(all.total);
        } catch {}
      }
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openOrderDetails = async (id: number) => {
    try {
      setIsLoadingDetails(id);
      const order = await adminOrdersApi.getById(id);
      setSelectedOrder(order);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Failed to load order details', error);
      showToast('حدث خطأ أثناء تحميل تفاصيل الطلب', 'error');
    } finally {
      setIsLoadingDetails(null);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedOrder) return;
    try {
      setIsVerifying(true);
      const res = await adminOrdersApi.verifyPayment(selectedOrder.id);
      setSelectedOrder(res.order);
      setOrders(orders.map(o => o.id === selectedOrder.id ? res.order : o));
      showToast('تم تأكيد الدفع بنجاح!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تأكيد الدفع', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleStatusChange = async (newStatus: string, orderId?: number) => {
    const targetId = orderId || selectedOrder?.id;
    if (!targetId) return;
    try {
      if (orderId) setUpdatingRowId(orderId);
      else setIsUpdatingStatus(true);
      const res = await adminOrdersApi.updateStatus(targetId, newStatus);
      if (selectedOrder?.id === targetId) setSelectedOrder(res.order);
      setOrders(orders.map(o => o.id === targetId ? res.order : o));
      showToast('تم تحديث الحالة بنجاح!', 'success');
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل تحديث الحالة', 'error');
    } finally {
      setUpdatingRowId(null);
      setIsUpdatingStatus(false);
    }
  };

  const handleSendToDelivery = async (skipPrimary: boolean = false) => {
    if (!selectedOrder) return;
    try {
      setIsUpdatingStatus(true);
      const res = await adminOrdersApi.sendToDelivery(selectedOrder.id, skipPrimary);
      showToast(res.message, 'success');
      openOrderDetails(selectedOrder.id);
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل الإرسال للتوصيل', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleSendToDeliveryFromRow = async (orderId: number, skipPrimary: boolean = false) => {
    try {
      setUpdatingRowId(orderId);
      const res = await adminOrdersApi.sendToDelivery(orderId, skipPrimary);
      showToast(res.message, 'success');
      loadOrders();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'فشل الإرسال للتوصيل', 'error');
    } finally {
      setUpdatingRowId(null);
    }
  };

  const getWhatsAppLink = () => {
    if (!selectedOrder || !selectedOrder.customer) return '#';
    let phone = selectedOrder.customer.phone;
    if (phone.startsWith('05')) phone = '966' + phone.substring(1);
    const msg = `مرحباً ${selectedOrder.customer.name}،\nطلبك رقم #${selectedOrder.order_number} جاهز للاستلام الآن من فرعنا! 🌸\n\nبانتظار زيارتك، لافندر فلوريست.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string, color: string }> = {
      pending:    { label: 'جديد',          color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      preparing:  { label: 'قيد التجهيز',   color: 'bg-blue-100 text-blue-800 border-blue-200' },
      ready:      { label: 'جاهز',          color: 'bg-purple-100 text-purple-800 border-purple-200' },
      delivering: { label: 'جاري التوصيل',  color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      delivered:  { label: 'مكتمل',         color: 'bg-green-100 text-green-800 border-green-200' },
      cancelled:  { label: 'ملغي',          color: 'bg-red-100 text-red-800 border-red-200' },
    };
    const b = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${b.color}`}>{b.label}</span>;
  };

  const isActive = (s: string) => !['delivered', 'cancelled'].includes(s);

  const getNextActionButton = (order: any) => {
    if (order.status === 'preparing' && order.delivery_type !== 'pickup') {
      // For delivery: "تم التجهيز - إرسال للمندوب"
      return (
        <button
          onClick={(e) => { e.stopPropagation(); handleSendToDeliveryFromRow(order.id, false); }}
          disabled={updatingRowId === order.id || order.driver_id !== null}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary-600 text-white hover:bg-primary-700 transition-colors disabled:opacity-50 whitespace-nowrap"
        >
          {updatingRowId === order.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Truck className="w-3.5 h-3.5" />}
          إرسال للمندوب
        </button>
      );
    }

    const next = nextStatus[order.status];
    if (!next) return null;

    const colors: Record<string, string> = {
      pending:    'bg-blue-600 hover:bg-blue-700 text-white',
      preparing:  'bg-purple-600 hover:bg-purple-700 text-white',
      ready:      'bg-indigo-600 hover:bg-indigo-700 text-white',
      delivering: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    };

    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleStatusChange(next.status, order.id); }}
        disabled={updatingRowId === order.id}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 whitespace-nowrap ${colors[order.status] || 'bg-primary-600 text-white hover:bg-primary-700'}`}
      >
        {updatingRowId === order.id ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
        {next.label}
      </button>
    );
  };

  const urgentCount = orders.filter(o => getUrgency(o.status, o.created_at) === 'danger').length;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-primary-950">الطلبات</h1>
          <p className="text-primary-600 mt-1">إدارة طلبات المتجر ومتابعة التوصيل.</p>
        </div>
        {urgentCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <span className="text-sm font-bold text-rose-700">{urgentCount} طلبات متأخرة!</span>
          </div>
        )}
      </div>

      {/* 2 Tabs: Incomplete / All */}
      <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-primary-100 mb-6 inline-flex gap-1">
        <button
          onClick={() => { setStatusFilter('incomplete'); setPage(1); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            statusFilter === 'incomplete'
              ? 'bg-primary-800 text-white shadow-md'
              : 'text-primary-600 hover:bg-primary-50'
          }`}
        >
          <Clock className="w-4 h-4" />
          غير مكتمل
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            statusFilter === 'incomplete' ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
          }`}>{incompleteCount}</span>
        </button>
        <button
          onClick={() => { setStatusFilter('all'); setPage(1); }}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            statusFilter === 'all'
              ? 'bg-primary-800 text-white shadow-md'
              : 'text-primary-600 hover:bg-primary-50'
          }`}
        >
          <Package className="w-4 h-4" />
          الكل
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-primary-100 text-primary-700'
          }`}>{totalCount}</span>
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-primary-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 border-b border-primary-100">
                <th className="w-10 px-3 py-3.5"></th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">رقم الطلب</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">العميل</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">المبلغ</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">الحالة</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">الوقت</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">المندوب</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm">الدفع</th>
                <th className="px-4 py-3.5 text-primary-900 font-bold text-sm text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                      <span className="text-primary-500 font-bold">جاري التحميل...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-16 text-center">
                    <Package className="w-12 h-12 text-primary-200 mx-auto mb-3" />
                    <p className="text-primary-500 font-bold">لا توجد طلبات</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const urgency = isActive(order.status) ? getUrgency(order.status, order.created_at) : 'ok';
                  const elapsed = getElapsedMinutes(order.created_at);
                  const isExpanded = expandedRows.has(order.id);
                  const rowBorder = urgency === 'danger' ? 'border-r-4 border-r-rose-500 bg-rose-50/30' : urgency === 'warn' ? 'border-r-4 border-r-amber-400 bg-amber-50/20' : '';

                  return (
                    <>
                      {/* Main Row */}
                      <tr key={order.id} className={`hover:bg-primary-50/30 transition-colors cursor-pointer ${rowBorder}`} onClick={() => toggleExpand(order.id)}>
                        <td className="px-3 py-3 text-center">
                          <button className="p-1 text-primary-400 hover:text-primary-700 transition-colors">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-primary-900 text-sm">{order.order_number}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-primary-900 text-sm">{order.customer?.name}</div>
                          <div className="text-xs text-primary-500" dir="ltr">{order.customer?.phone}</div>
                        </td>
                        <td className="px-4 py-3 font-bold text-primary-900 text-sm">{order.total} ر.س</td>
                        <td className="px-4 py-3">{getStatusBadge(order.status)}</td>
                        <td className="px-4 py-3">
                          {isActive(order.status) ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
                              urgency === 'danger' ? 'bg-rose-100 text-rose-700' :
                              urgency === 'warn' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-50 text-emerald-700'
                            }`}>
                              <Timer className="w-3 h-3" />
                              {formatElapsed(elapsed)}
                              {urgency === 'danger' && <span className="text-rose-600 mr-1">!</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-primary-400">{new Date(order.created_at).toLocaleDateString('ar-SA')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.delivery_type === 'local' ? (
                            order.driver ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-purple-700">
                                <Truck className="w-3.5 h-3.5" />
                                {order.driver.name}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600">
                                <Clock className="w-3 h-3" />
                                بانتظار
                              </span>
                            )
                          ) : order.delivery_type === 'pickup' ? (
                            <span className="text-xs text-primary-500">استلام</span>
                          ) : (
                            <span className="text-xs text-primary-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {order.payment_status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> مدفوع</span>
                          ) : order.bank_transfer_receipt ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600"><Clock className="w-3.5 h-3.5" /> بانتظار</span>
                          ) : (
                            <span className="text-xs text-gray-400">غير مدفوع</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                            {getNextActionButton(order)}
                            <button 
                              onClick={() => openOrderDetails(order.id)}
                              disabled={isLoadingDetails === order.id}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50"
                            >
                              {isLoadingDetails === order.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <Eye className="w-3.5 h-3.5" />
                              )}
                              عرض
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Row - Products */}
                      {isExpanded && (
                        <tr key={`${order.id}-expanded`} className="bg-primary-50/20">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="flex flex-wrap gap-3">
                              {order.items?.map((item: any) => (
                                <div key={item.id} className="flex items-center gap-3 bg-white px-3 py-2 rounded-xl border border-primary-100 shadow-sm">
                                  {item.product?.primary_image && (
                                    <img src={`http://localhost:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover border border-primary-50" />
                                  )}
                                  <div>
                                    <p className="text-sm font-bold text-primary-900">{item.product_name}</p>
                                    <p className="text-xs text-primary-500">{item.quantity} × {item.unit_price} ر.س = <strong>{item.total_price} ر.س</strong></p>
                                  </div>
                                </div>
                              ))}
                              {(!order.items || order.items.length === 0) && (
                                <p className="text-sm text-primary-400 py-2">اضغط على "عرض" لتحميل تفاصيل المنتجات.</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
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
              className="px-4 py-2 border border-primary-200 rounded-lg text-primary-700 disabled:opacity-50 font-medium text-sm"
            >
              السابق
            </button>
            <span className="text-primary-600 text-sm font-bold">صفحة {page} من {totalPages}</span>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="px-4 py-2 border border-primary-200 rounded-lg text-primary-700 disabled:opacity-50 font-medium text-sm"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* ── Order Details Modal ────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-primary-950/40 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-primary-100 bg-primary-50/30">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-primary-900">طلب #{selectedOrder.order_number}</h2>
                    {getStatusBadge(selectedOrder.status)}
                    {isActive(selectedOrder.status) && (() => {
                      const urg = getUrgency(selectedOrder.status, selectedOrder.created_at);
                      const el = getElapsedMinutes(selectedOrder.created_at);
                      return (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          urg === 'danger' ? 'bg-rose-100 text-rose-700' :
                          urg === 'warn' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-50 text-emerald-700'
                        }`}>
                          <Timer className="w-3.5 h-3.5" />
                          مضى {formatElapsed(el)}
                          {urg === 'danger' && ' - متأخر!'}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openOrderDetails(selectedOrder.id)} className="p-2 text-primary-600 hover:text-primary-800 bg-white rounded-full hover:bg-primary-50 transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
                    </button>
                    <button onClick={() => setIsModalOpen(false)} className="p-2 text-primary-400 hover:text-primary-700 bg-white rounded-full hover:bg-primary-50 transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column */}
                  <div className="lg:col-span-1 space-y-5">
                    <div className="bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
                      <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><UserIcon /> بيانات العميل</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-primary-500 block mb-1">الاسم</span>
                          <strong className="text-primary-900">{selectedOrder.address?.recipient_name || selectedOrder.customer?.name}</strong>
                        </div>
                        <div>
                          <span className="text-primary-500 block mb-1">رقم الجوال</span>
                          <strong className="text-primary-900" dir="ltr">{selectedOrder.address?.recipient_phone || selectedOrder.customer?.phone || 'لا يوجد'}</strong>
                        </div>
                        <div>
                          <span className="text-primary-500 block mb-1">طريقة الاستلام</span>
                          <strong className="text-primary-900">{selectedOrder.delivery_type === 'pickup' ? 'استلام من الفرع' : 'توصيل'}</strong>
                        </div>
                        {selectedOrder.delivery_type === 'local' && (
                          <div className="pt-2 mt-2 border-t border-primary-50">
                            <span className="text-primary-500 block mb-1">المندوب</span>
                            {selectedOrder.driver ? (
                              <div className="flex flex-col gap-1">
                                <strong className="text-primary-900 flex items-center gap-1.5"><Truck className="w-4 h-4 text-primary-500" /> {selectedOrder.driver.name}</strong>
                                <a href={`https://wa.me/${selectedOrder.driver.phone?.replace(/^05/, '9665')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline" dir="ltr">{selectedOrder.driver.phone}</a>
                              </div>
                            ) : (
                              <strong className="text-amber-600 flex items-center gap-1.5"><Clock className="w-4 h-4" /> بانتظار استلام مندوب</strong>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedOrder.delivery_type === 'local' && selectedOrder.address && (
                      <div className="bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
                        <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5 text-primary-500" /> عنوان التوصيل</h3>
                        <p className="text-sm text-primary-800 font-medium leading-relaxed">
                          {selectedOrder.address.street || selectedOrder.address.street_address || ''}<br/>
                          {selectedOrder.address.district ? `${selectedOrder.address.district}، ` : ''}{selectedOrder.address.city}
                        </p>
                        {selectedOrder.address.latitude && isLoaded ? (
                          <div className="mt-4">
                            <div className="h-40 rounded-xl overflow-hidden border border-primary-100 mb-2">
                              <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat: parseFloat(selectedOrder.address.latitude), lng: parseFloat(selectedOrder.address.longitude) }}
                                zoom={15}
                                options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
                              >
                                <Marker position={{ lat: parseFloat(selectedOrder.address.latitude), lng: parseFloat(selectedOrder.address.longitude) }} />
                              </GoogleMap>
                            </div>
                            <a href={`https://maps.google.com/?q=${selectedOrder.address.latitude},${selectedOrder.address.longitude}`} target="_blank" rel="noreferrer" className="block text-center bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors">
                              فتح في خرائط جوجل
                            </a>
                          </div>
                        ) : selectedOrder.address.latitude && (
                          <a href={`https://maps.google.com/?q=${selectedOrder.address.latitude},${selectedOrder.address.longitude}`} target="_blank" rel="noreferrer" className="mt-4 block text-center bg-primary-50 text-primary-700 py-2 rounded-lg text-sm font-bold hover:bg-primary-100 transition-colors">
                            فتح في خرائط جوجل
                          </a>
                        )}
                      </div>
                    )}

                    {selectedOrder.notes && (
                      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100">
                        <h3 className="font-bold text-amber-900 mb-2">ملاحظات الطلب</h3>
                        <p className="text-sm text-amber-800">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="lg:col-span-2 space-y-5">
                    
                    {/* Preparing Action */}
                    {selectedOrder.status === 'preparing' && (
                      <div className="bg-primary-50 p-5 rounded-2xl border-2 border-primary-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-primary-900 mb-1 flex items-center gap-2"><Package className="w-5 h-5 text-primary-500" /> الطلب قيد التجهيز</h3>
                          <p className="text-primary-700 text-sm font-medium">هل انتهيت من تجهيز وتغليف هذا الطلب؟</p>
                        </div>
                        {selectedOrder.delivery_type === 'pickup' ? (
                          <button onClick={() => handleStatusChange('ready')} disabled={isUpdatingStatus} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                            <CheckCircle2 className="w-5 h-5" /> الطلب جاهز للاستلام
                          </button>
                        ) : (
                          <button onClick={() => handleSendToDelivery(false)} disabled={isUpdatingStatus || selectedOrder.driver_id !== null} className="bg-primary-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                            <Truck className="w-5 h-5" /> تم التجهيز (إرسال للمندوب)
                          </button>
                        )}
                      </div>
                    )}

                    {/* Ready + Pickup */}
                    {selectedOrder.status === 'ready' && selectedOrder.delivery_type === 'pickup' && (
                      <div className="bg-emerald-50 p-5 rounded-2xl border-2 border-emerald-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-emerald-900 mb-1 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-emerald-500" /> الطلب جاهز في الفرع</h3>
                          <p className="text-emerald-700 text-sm font-medium">بانتظار استلام العميل.</p>
                        </div>
                        <a href={`https://wa.me/966${selectedOrder.customer?.phone?.replace(/^0/, '')}?text=${encodeURIComponent(`مرحباً ${selectedOrder.customer?.name}،\nطلبك رقم ${selectedOrder.order_number} جاهز الآن للاستلام من فرعنا! 🌸\nنسعد بزيارتك.`)}`} target="_blank" rel="noreferrer" className="bg-[#25D366] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#128C7E] transition-colors shadow-lg shadow-[#25D366]/20 flex items-center gap-2 whitespace-nowrap">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>
                          مراسلة العميل
                        </a>
                      </div>
                    )}
                    
                    {/* Bank Transfer */}
                    {selectedOrder.payment_method === 'bank_transfer' && (
                      <div className={`p-5 rounded-2xl border-2 shadow-sm ${selectedOrder.payment_status === 'paid' ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-amber-200'}`}>
                        <div className="flex justify-between items-start mb-5">
                          <div>
                            <h3 className="text-lg font-bold text-primary-900 mb-1 flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" /> إيصال التحويل البنكي</h3>
                            {selectedOrder.payment_status === 'paid' ? (
                              <p className="text-emerald-700 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> تم تأكيد الدفع</p>
                            ) : selectedOrder.bank_transfer_receipt ? (
                              <p className="text-amber-600 text-sm font-medium flex items-center gap-1"><Clock className="w-4 h-4" /> بانتظار التحقق</p>
                            ) : (
                              <p className="text-rose-500 text-sm font-medium">لم يرفع الإيصال بعد</p>
                            )}
                          </div>
                          {selectedOrder.payment_status !== 'paid' && selectedOrder.bank_transfer_receipt && (
                            <button onClick={handleVerifyPayment} disabled={isVerifying} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-2">
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
                                <a href={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} target="_blank" rel="noreferrer" className="bg-primary-800 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-primary-900"><Download className="w-4 h-4" /> تحميل</a>
                              </div>
                            ) : (
                              <a href={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} target="_blank" rel="noreferrer">
                                <img src={`http://localhost:8000${selectedOrder.bank_transfer_receipt}`} alt="إيصال التحويل" className="w-full h-full object-contain bg-black/5" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="text-white font-bold bg-black/50 px-4 py-2 rounded-lg">اضغط للتكبير</span>
                                </div>
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Items */}
                    <div className="bg-white p-5 rounded-2xl border border-primary-100 shadow-sm">
                      <h3 className="font-bold text-primary-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-primary-500" /> المنتجات المطلوبة</h3>
                      <div className="space-y-3 mb-5">
                        {selectedOrder.items?.map((item: any) => (
                          <div key={item.id} className="flex gap-4 p-3 bg-primary-50/30 rounded-xl border border-primary-50">
                            <div className="w-14 h-14 bg-white rounded-lg overflow-hidden shrink-0 border border-primary-100">
                              {item.product?.primary_image && (<img src={`http://localhost:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-primary-900 text-sm truncate">{item.product_name}</h4>
                              <p className="text-xs text-primary-500">الكمية: {item.quantity} × {item.unit_price} ر.س</p>
                              {item.gift_message && (<p className="text-xs text-primary-700 bg-white p-1.5 mt-1.5 rounded border border-primary-100 font-medium truncate">رسالة الكرت: "{item.gift_message}"</p>)}
                            </div>
                            <div className="font-bold text-primary-900 text-sm whitespace-nowrap">{item.total_price} ر.س</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 pt-4 border-t border-primary-100 text-sm font-medium">
                        <div className="flex justify-between text-primary-600"><span>المجموع الفرعي</span><span>{selectedOrder.subtotal} ر.س</span></div>
                        <div className="flex justify-between text-primary-600"><span>رسوم التوصيل</span><span>{selectedOrder.delivery_fee} ر.س</span></div>
                        <div className="flex justify-between text-xl font-bold text-primary-950 pt-4 border-t border-primary-100 mt-2"><span>الإجمالي</span><span>{selectedOrder.total} ر.س</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="p-5 border-t border-primary-100 bg-white flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-primary-700">تغيير الحالة:</span>
                  <div className="flex bg-primary-50 p-1 rounded-xl">
                    {(['preparing', 'ready', 'delivering', 'delivered'] as const).map(s => (
                      <button key={s} onClick={() => handleStatusChange(s)} disabled={isUpdatingStatus || selectedOrder.status === s || (s === 'delivering' && selectedOrder.delivery_type === 'pickup')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${selectedOrder.status === s ? 'bg-white shadow text-primary-900' : 'text-primary-600 hover:text-primary-900 disabled:opacity-30'}`}>
                        {{ preparing: 'تجهيز', ready: 'جاهز', delivering: 'توصيل', delivered: 'مكتمل' }[s]}
                      </button>
                    ))}
                  </div>
                </div>

                {selectedOrder.status === 'ready' && (
                  <div className="flex items-center gap-2">
                    {selectedOrder.delivery_type === 'pickup' ? (
                      <a href={getWhatsAppLink()} target="_blank" rel="noreferrer" className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors flex items-center gap-2">
                        إبلاغ العميل عبر واتساب
                      </a>
                    ) : (
                      <>
                        <button onClick={() => handleSendToDelivery(false)} disabled={isUpdatingStatus || selectedOrder.driver_id !== null} className="bg-primary-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary-900 transition-colors flex items-center gap-2 disabled:opacity-50">
                          <Truck className="w-4 h-4"/> إرسال للمندوب
                        </button>
                        <button onClick={() => handleSendToDelivery(true)} disabled={isUpdatingStatus || selectedOrder.driver_id !== null} className="bg-amber-100 text-amber-800 border border-amber-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-200 transition-colors disabled:opacity-50">
                          تخطي الأساسي
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                <button onClick={() => handleStatusChange('cancelled')} disabled={isUpdatingStatus || selectedOrder.status === 'cancelled'} className="text-sm font-bold text-rose-500 hover:text-rose-700 px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors">
                  إلغاء الطلب
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 z-[60] font-bold text-white border-2 ${toastMessage.type === 'success' ? 'bg-emerald-600 border-emerald-400' : 'bg-rose-600 border-rose-400'}`}>
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <X className="w-6 h-6" />}
            {toastMessage.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-500">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
      <circle cx="12" cy="7" r="4"></circle>
    </svg>
  );
}
