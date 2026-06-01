import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Package
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

// Mock data
const salesData = [
  { name: 'السبت', sales: 4000 },
  { name: 'الأحد', sales: 3000 },
  { name: 'الإثنين', sales: 2000 },
  { name: 'الثلاثاء', sales: 2780 },
  { name: 'الأربعاء', sales: 1890 },
  { name: 'الخميس', sales: 2390 },
  { name: 'الجمعة', sales: 3490 },
];

const stats = [
  { title: 'إجمالي المبيعات', value: '24,500 ر.س', icon: <DollarSign size={24} />, trend: '+12%', color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { title: 'الطلبات الجديدة', value: '145', icon: <ShoppingBag size={24} />, trend: '+5%', color: 'text-blue-500', bg: 'bg-blue-50' },
  { title: 'العملاء', value: '1,230', icon: <Users size={24} />, trend: '+18%', color: 'text-purple-500', bg: 'bg-purple-50' },
  { title: 'منتجات نشطة', value: '48', icon: <TrendingUp size={24} />, trend: '+2%', color: 'text-rose-500', bg: 'bg-rose-50' },
];

const recentOrders = [
  { id: '#ORD-001', customer: 'أحمد محمد', date: 'منذ ساعتين', total: '350 ر.س', status: 'قيد التجهيز' },
  { id: '#ORD-002', customer: 'سارة خالد', date: 'منذ 3 ساعات', total: '150 ر.س', status: 'مكتمل' },
  { id: '#ORD-003', customer: 'فهد عبدالله', date: 'منذ 5 ساعات', total: '450 ر.س', status: 'بانتظار الدفع' },
  { id: '#ORD-004', customer: 'نورة سعد', date: 'أمس', total: '220 ر.س', status: 'مكتمل' },
];

const componentsStock = [
  { name: 'ورد جوري أحمر', stock: 120, min: 20, unit: 'حبة', status: 'good' },
  { name: 'تغليف أسود فاخر', stock: 15, min: 50, unit: 'متر', status: 'low' },
  { name: 'زنبق أبيض', stock: 8, min: 10, unit: 'حبة', status: 'critical' },
  { name: 'شريط ستان وردي', stock: 200, min: 20, unit: 'متر', status: 'good' },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-primary-500 mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-primary-950">{stat.value}</h3>
              <p className="text-sm font-medium text-emerald-500 mt-2 flex items-center gap-1">
                <TrendingUp size={14} />
                {stat.trend} مقارنة بآخر 7 أيام
              </p>
            </div>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 bg-white p-6 rounded-2xl border border-primary-100 shadow-sm"
        >
          <h3 className="text-lg font-bold text-primary-900 mb-6 font-serif">مبيعات الأسبوع</h3>
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#8b5cf6" 
                  strokeWidth={3}
                  dot={{r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}}
                  activeDot={{r: 6, fill: '#8b5cf6', strokeWidth: 2, stroke: '#fff'}}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Components Stock (Low Inventory Alert) */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl border border-primary-100 shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-primary-900 font-serif">حالة المخزون (المكونات)</h3>
            <button className="text-sm text-primary-600 hover:text-primary-900 font-medium">عرض الكل</button>
          </div>
          
          <div className="space-y-4 flex-1">
            {componentsStock.map((comp, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    comp.status === 'critical' ? 'bg-red-50 text-red-500' :
                    comp.status === 'low' ? 'bg-amber-50 text-amber-500' :
                    'bg-emerald-50 text-emerald-500'
                  }`}>
                    <Package size={18} />
                  </div>
                  <div>
                    <p className="font-semibold text-primary-900 text-sm">{comp.name}</p>
                    <p className="text-xs text-primary-500">الحد الأدنى: {comp.min}</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className={`font-bold text-lg ${
                    comp.status === 'critical' ? 'text-red-600' :
                    comp.status === 'low' ? 'text-amber-600' :
                    'text-emerald-600'
                  }`}>
                    {comp.stock} <span className="text-xs font-normal text-primary-500">{comp.unit}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border border-primary-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-primary-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-primary-900 font-serif">أحدث الطلبات</h3>
          <button className="text-sm font-medium px-4 py-2 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
            إدارة الطلبات
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-primary-50/50 text-primary-500 text-sm">
                <th className="px-6 py-4 font-medium">رقم الطلب</th>
                <th className="px-6 py-4 font-medium">العميل</th>
                <th className="px-6 py-4 font-medium">التاريخ</th>
                <th className="px-6 py-4 font-medium">المجموع</th>
                <th className="px-6 py-4 font-medium">الحالة</th>
                <th className="px-6 py-4 font-medium">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-100">
              {recentOrders.map((order, i) => (
                <tr key={i} className="hover:bg-primary-50/30 transition-colors">
                  <td className="px-6 py-4 font-semibold text-primary-900">{order.id}</td>
                  <td className="px-6 py-4 text-primary-700">{order.customer}</td>
                  <td className="px-6 py-4 text-primary-500 text-sm">{order.date}</td>
                  <td className="px-6 py-4 font-bold text-accent-700">{order.total}</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'مكتمل' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'قيد التجهيز' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary-500 hover:text-primary-900 transition-colors">
                      عرض
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
