import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { User, Phone, Mail, MapPin, Calendar, ShoppingBag, Loader2, ArrowRight } from 'lucide-react';
import { customerAdminApi } from '../../services/api';

export default function CustomerDetails() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      customerAdminApi.getById(Number(id))
        .then(data => setCustomer(data))
        .catch(err => console.error("Failed to load customer", err))
        .finally(() => setIsLoading(false));
    }
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return <div className="text-center text-primary-500 mt-10">العميل غير موجود</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/customers" className="p-2 hover:bg-primary-50 rounded-xl transition-colors">
          <ArrowRight className="text-primary-600" />
        </Link>
        <h1 className="text-2xl font-bold text-primary-950 font-serif">تفاصيل العميل</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              <User size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-900">{customer.name}</h2>
              <p className="text-sm text-primary-500 flex items-center gap-1 mt-1">
                <Calendar size={14} /> انضم في {new Date(customer.created_at).toLocaleDateString('ar-SA')}
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-primary-50">
            {customer.email && (
              <div className="flex items-center gap-3 text-primary-900 font-bold bg-primary-50 p-2 rounded-xl">
                <Mail size={18} className="text-primary-500" />
                <span>{customer.email}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-primary-700">
              <Phone size={18} className="text-primary-400" />
              <span dir="ltr">{customer.phone}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary-50">
            <div className="bg-primary-50 p-3 rounded-xl text-center">
              <p className="text-xs text-primary-500 mb-1">عدد الطلبات</p>
              <p className="font-bold text-primary-900 text-lg">{customer.orders_count || 0}</p>
            </div>
            <div className="bg-emerald-50 p-3 rounded-xl text-center">
              <p className="text-xs text-emerald-600 mb-1">إجمالي المدفوعات</p>
              <p className="font-bold text-emerald-700 text-lg">{Number(customer.orders_sum_total || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Addresses and Orders */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Addresses */}
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary-100 flex items-center gap-2">
              <MapPin className="text-primary-500" size={20} />
              <h3 className="font-bold text-primary-900 font-serif">العناوين المسجلة</h3>
            </div>
            <div className="p-4">
              {customer.addresses?.length === 0 ? (
                <p className="text-primary-400 text-center py-4">لا توجد عناوين مسجلة</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customer.addresses?.map((address: any) => (
                    <div key={address.id} className="p-3 border border-primary-100 rounded-xl bg-primary-50/30">
                      <p className="font-medium text-primary-900 mb-1">{address.label}</p>
                      <p className="text-sm text-primary-600">{address.address_line1}</p>
                      <p className="text-sm text-primary-600">{address.address_line2}</p>
                      {address.is_default && (
                        <span className="inline-block mt-2 text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-md font-medium">الافتراضي</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Orders History */}
          <div className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-primary-100 flex items-center gap-2">
              <ShoppingBag className="text-primary-500" size={20} />
              <h3 className="font-bold text-primary-900 font-serif">سجل الطلبات</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-primary-50/50 text-primary-500 text-sm">
                    <th className="px-6 py-3 font-medium">رقم الطلب</th>
                    <th className="px-6 py-3 font-medium">صاحب الطلب</th>
                    <th className="px-6 py-3 font-medium">المستلم</th>
                    <th className="px-6 py-3 font-medium">التاريخ</th>
                    <th className="px-6 py-3 font-medium">المجموع</th>
                    <th className="px-6 py-3 font-medium">الحالة</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-100">
                  {customer.orders?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-primary-400">لا يوجد طلبات سابقة</td>
                    </tr>
                  ) : (
                    customer.orders?.map((order: any) => (
                      <tr key={order.id} className="hover:bg-primary-50/30">
                        <td className="px-6 py-3 font-medium text-primary-900" dir="ltr">{order.order_number || '#ORD-'+order.id}</td>
                        <td className="px-6 py-3">
                          <div className="text-sm font-bold text-primary-900">{order.owner_name || customer.name}</div>
                          <div className="text-xs text-primary-500" dir="ltr">{order.owner_phone || customer.phone}</div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="text-sm font-bold text-primary-900">{order.address?.recipient_name || 'غير محدد'}</div>
                          <div className="text-xs text-primary-500" dir="ltr">{order.address?.recipient_phone || 'غير محدد'}</div>
                        </td>
                        <td className="px-6 py-3 text-sm text-primary-600">{new Date(order.created_at).toLocaleDateString('ar-SA')}</td>
                        <td className="px-6 py-3 font-bold text-emerald-600">{order.total} ر.س</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <Link to={`/admin/orders/${order.id}`} className="text-primary-500 hover:text-primary-700 text-sm font-medium">
                            عرض الطلب
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
