import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, Loader2, Eye, Ban, CheckCircle } from 'lucide-react';
import { customerAdminApi } from '../../services/api';

export default function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchCustomers = () => {
    setIsLoading(true);
    customerAdminApi.getAll(page, search)
      .then((data: any) => {
        setCustomers(data.data);
        setTotalPages(data.last_page);
      })
      .catch(err => console.error("Failed to load customers", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (page === 1) {
      fetchCustomers();
    } else {
      setPage(1); // will trigger useEffect
    }
  };

  const toggleStatus = (id: number) => {
    if (window.confirm('هل أنت متأكد من تغيير حالة هذا العميل؟')) {
      customerAdminApi.toggleActive(id)
        .then(() => {
          fetchCustomers();
        })
        .catch(err => console.error("Failed to toggle status", err));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary-950 font-serif flex items-center gap-2">
          <Users className="text-primary-500" />
          إدارة العملاء
        </h1>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-primary-100 shadow-sm flex items-center gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-400" size={20} />
          <input
            type="text"
            placeholder="ابحث بالاسم، الجوال، أو البريد الإلكتروني..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-3 rounded-xl border border-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </form>
        <button 
          onClick={handleSearch}
          className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl transition-all"
        >
          بحث
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 text-primary-500 text-sm">
                <th className="px-6 py-4 font-medium">الحساب (الإيميل والجوال)</th>
                <th className="px-6 py-4 font-medium">الاسم المسجل</th>
                <th className="px-6 py-4 font-medium">تاريخ التسجيل</th>
                <th className="px-6 py-4 font-medium">الطلبات</th>
                <th className="px-6 py-4 font-medium">المشتريات</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-primary-400">
                    لا يوجد عملاء
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary-900">{customer.email}</div>
                      <div className="text-sm text-primary-500 mt-1">
                        <span dir="ltr" className="inline-block">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-primary-600 text-sm">
                      {customer.name}
                    </td>
                    <td className="px-6 py-4 text-primary-600 text-sm">
                      {new Date(customer.created_at).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-primary-100 text-primary-700 py-1 px-3 rounded-full text-sm font-medium">
                        {customer.orders_count || 0} طلب
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600">
                      {Number(customer.orders_sum_total || 0).toFixed(2)} ر.س
                    </td>
                    <td className="px-6 py-4">
                      {customer.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-medium bg-emerald-50 px-2 py-1 rounded-lg w-fit">
                          <CheckCircle size={14} /> نشط
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-lg w-fit">
                          <Ban size={14} /> محظور
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center space-x-2 space-x-reverse">
                      <Link 
                        to={`/admin/customers/${customer.id}`}
                        className="inline-flex items-center gap-1 text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium"
                      >
                        <Eye size={16} /> التفاصيل
                      </Link>
                      <button 
                        onClick={() => toggleStatus(customer.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                          customer.is_active 
                            ? 'text-red-600 hover:bg-red-50' 
                            : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {customer.is_active ? <><Ban size={16} /> حظر</> : <><CheckCircle size={16} /> تفعيل</>}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-primary-100 flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-10 h-10 rounded-xl font-medium transition-all ${
                  page === p ? 'bg-primary-600 text-white' : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
