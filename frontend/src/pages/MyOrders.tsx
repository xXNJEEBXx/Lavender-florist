import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, CheckCircle2, ChevronLeft, CalendarDays } from 'lucide-react';
import { orderApi } from '../services/api';
import { motion } from 'framer-motion';

export default function MyOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        const data = await orderApi.getOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string, color: string, icon: any }> = {
      pending: { label: 'جديد', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      preparing: { label: 'قيد التجهيز', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Package },
      ready: { label: 'جاهز للاستلام', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: CheckCircle2 },
      delivering: { label: 'جاري التوصيل', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: TruckIcon },
      delivered: { label: 'مكتمل', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      cancelled: { label: 'ملغي', color: 'bg-red-100 text-red-800 border-red-200', icon: XIcon },
    };
    const b = badges[status] || { label: status, color: 'bg-gray-100 text-gray-800', icon: Package };
    const Icon = b.icon;
    
    return (
      <span className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 ${b.color}`}>
        <Icon className="w-3.5 h-3.5" /> {b.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-primary-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-primary-950">طلباتي</h1>
          <p className="text-primary-600 mt-2">سجل بجميع طلباتك السابقة والحالية.</p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-primary-400">
            <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-4"></div>
            <p className="font-bold">جاري تحميل الطلبات...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-primary-100 shadow-sm">
            <div className="w-24 h-24 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-primary-400" />
            </div>
            <h2 className="text-xl font-bold text-primary-900 mb-2">لا توجد طلبات بعد</h2>
            <p className="text-primary-600 mb-8 max-w-md mx-auto">لم تقم بإجراء أي طلبات حتى الآن. استكشف متجرنا واصنع لحظة لا تنسى لمن تحب!</p>
            <Link to="/" className="inline-flex px-8 py-3 bg-primary-800 text-white rounded-xl font-bold hover:bg-primary-900 transition-all shadow-lg shadow-primary-900/10">
              تصفح التنسيقات
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={order.id} 
                className="bg-white rounded-3xl border border-primary-100 shadow-sm overflow-hidden hover:border-primary-300 transition-colors"
              >
                <div className="p-5 md:p-6 border-b border-primary-50 bg-primary-50/30 flex flex-wrap gap-4 items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-2.5 rounded-xl border border-primary-100 shadow-sm">
                      <Package className="w-6 h-6 text-primary-700" />
                    </div>
                    <div>
                      <h3 className="font-bold text-primary-950 font-mono">#{order.order_number}</h3>
                      <div className="flex items-center gap-2 text-xs text-primary-500 mt-1 font-medium">
                        <CalendarDays className="w-3.5 h-3.5" />
                        {new Date(order.created_at).toLocaleDateString('ar-SA')}
                      </div>
                      {(order.owner_name || order.customer?.name) && (
                        <div className="text-xs font-bold text-primary-700 mt-1">
                          صاحب الطلب: {order.owner_name || order.customer?.name}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(order.status)}
                  </div>
                </div>
                
                <div className="p-5 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-between">
                  <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="relative group shrink-0">
                        <div className="w-16 h-16 rounded-xl bg-gray-50 border border-primary-100 overflow-hidden">
                          {item.product?.primary_image ? (
                            <img src={`http://127.0.0.1:8000${item.product.primary_image.image_url}`} alt={item.product_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300">
                              <Package className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary-800 text-white rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm">
                          {item.quantity}
                        </div>
                      </div>
                    ))}
                    
                    {order.items?.length === 0 && (
                      <span className="text-sm text-gray-500">لا توجد منتجات (خطأ في النظام)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto border-t md:border-t-0 border-primary-50 pt-4 md:pt-0 mt-4 md:mt-0">
                    <div className="text-right">
                      <p className="text-xs text-primary-500 font-medium mb-1">الإجمالي</p>
                      <p className="text-lg font-bold text-primary-950">{order.total} ر.س</p>
                    </div>
                    
                    <Link 
                      to={`/orders/${order.order_number}`}
                      className="flex items-center gap-2 bg-primary-50 text-primary-800 px-5 py-2.5 rounded-xl font-bold hover:bg-primary-100 transition-colors border border-primary-100 whitespace-nowrap"
                    >
                      تتبع الطلب <ChevronLeft className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple icons missing from import
function TruckIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>;
}

function XIcon(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>;
}
